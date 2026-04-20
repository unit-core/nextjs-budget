import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { RRule, rrulestr } from "https://esm.sh/rrule@2.8.1";

const BATCH_SIZE = 10;
const VISIBILITY_TIMEOUT_SEC = 300;

console.info("process-recurring started");

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: messages, error } = await supabase.rpc("pgmq_read", {
    queue_name: "recurring_transactions",
    vt: VISIBILITY_TIMEOUT_SEC,
    qty: BATCH_SIZE,
  });

  if (error) return respond({ error: error.message }, 500);
  if (!messages?.length) return respond({ processed: 0 });

  const results = [];

  for (const msg of messages) {
    const { template_id } = msg.message;
    const msgId: number = msg.msg_id;

    try {
      const { data: tmpl, error: tmplErr } = await supabase
        .from("transaction_templates")
        .select(`
          id, name, transaction_type, folder_id, owner_id, rrule, last_executed_at,
          transaction_item_templates (
            name, amount, currency_code,
            transaction_item_category_id, transaction_folder_id
          )
        `)
        .eq("id", template_id)
        .single();

      if (tmplErr || !tmpl?.rrule) {
        await ack(supabase, msgId);
        continue;
      }

      // rrulestr умеет парсить полный формат включая DTSTART на отдельной строке
      const rule = rrulestr(tmpl.rrule) as RRule;
      const dtstart = rule.options.dtstart ?? new Date();
      const after = tmpl.last_executed_at ? new Date(tmpl.last_executed_at) : dtstart;
      const now = new Date();
      const dates = rule.between(after, now, true);

      for (const date of dates) {
        const { data: tx, error: txErr } = await supabase
          .from("transactions")
          .insert({
            name: tmpl.name,
            transaction_type: tmpl.transaction_type,
            status: "CONFIRMED",
            executed_at: date.toISOString(),
            folder_id: tmpl.folder_id,
            owner_id: tmpl.owner_id,
          })
          .select("id")
          .single();

        if (txErr || !tx) throw new Error(txErr?.message ?? "transaction insert failed");

        if (tmpl.transaction_item_templates?.length) {
          const { error: itemsErr } = await supabase
            .from("transaction_items")
            .insert(
              tmpl.transaction_item_templates.map((item: any) => ({
                transaction_id: tx.id,
                transaction_folder_id: item.transaction_folder_id,
                owner_id: tmpl.owner_id,
                name: item.name,
                amount: item.amount,
                currency_code: item.currency_code,
                transaction_item_category_id: item.transaction_item_category_id,
                executed_at: date.toISOString(),
              }))
            );

          if (itemsErr) throw new Error(itemsErr.message);
        }
      }

      await supabase
        .from("transaction_templates")
        .update({
          last_executed_at: now.toISOString(),
          next_execution_at: rule.after(now)?.toISOString() ?? null,
        })
        .eq("id", template_id);

      await ack(supabase, msgId);
      results.push({ template_id, created: dates.length });

    } catch (err) {
      // не ackаем — сообщение вернётся в очередь через 5 минут
      results.push({ template_id, error: String(err) });
    }
  }

  return respond({ processed: results.length, results });
});

async function ack(supabase: any, msgId: number) {
  await supabase.rpc("pgmq_delete", {
    queue_name: "recurring_transactions",
    msg_id: msgId,
  });
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
  });
}
