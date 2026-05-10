import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import {
  authenticateMcpRequest,
  createMcpSupabaseClient,
} from "@/lib/supabase/mcp";
import type { TransactionInsert } from "@/lib/models/transaction";

export const maxDuration = 60;

function buildHandler(ownerId: string) {
  return createMcpHandler(
    (server) => {
      server.registerTool(
        "list_transactions",
        {
          title: "List transactions",
          description:
            "List the user's transactions, most recent first. Filter by type and limit.",
          inputSchema: {
            limit: z.number().int().min(1).max(100).default(20),
            transaction_type: z.enum(["EXPENSE", "INCOME"]).optional(),
          },
        },
        async ({ limit, transaction_type }) => {
          const supabase = createMcpSupabaseClient();
          let query = supabase
            .from("transactions")
            .select("id, name, executed_at, transaction_type, status")
            .eq("owner_id", ownerId)
            .order("executed_at", { ascending: false })
            .limit(limit);

          if (transaction_type) query = query.eq("transaction_type", transaction_type);

          const { data, error } = await query;
          if (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Supabase error: ${error.message}` }],
            };
          }

          return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          };
        },
      );

      server.registerTool(
        "create_transaction",
        {
          title: "Create transaction",
          description:
            "Create a new transaction from a free-form text description. The text is queued for AI parsing — the transaction is returned with status IDLE/PENDING and is filled in asynchronously (status will move to CONFIRMED once items and category are detected). Use this for quick capture like 'Coffee 4.50 EUR at Starbucks'.",
          inputSchema: {
            text: z
              .string()
              .min(1)
              .max(2000)
              .describe(
                "Free-form description of the transaction (merchant, amount, currency, what was bought).",
              ),
          },
        },
        async ({ text }) => {
          const supabase = createMcpSupabaseClient();
          const payload: TransactionInsert = {
            owner_id: ownerId,
            source: { source_type: "text", source: { text } },
            folder_id: ownerId,
            name: text,
          };

          const { data, error } = await supabase
            .from("transactions")
            .insert(payload)
            .select("id, name, status, created_at")
            .single();

          if (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Supabase error: ${error.message}` }],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    ...data,
                    note: "Transaction queued. The AI pipeline will parse items, amount and category asynchronously; status will become CONFIRMED once done. Re-fetch via list_transactions to see the parsed result.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        },
      );

      server.registerTool(
        "sum_expenses_by_category",
        {
          title: "Sum expenses by category",
          description:
            "Sum expense amounts grouped by category between two ISO dates (inclusive).",
          inputSchema: {
            from: z.string().describe("ISO date, e.g. 2026-01-01"),
            to: z.string().describe("ISO date, e.g. 2026-05-10"),
          },
        },
        async ({ from, to }) => {
          const supabase = createMcpSupabaseClient();
          const { data, error } = await supabase
            .from("transaction_items")
            .select(
              "amount, currency_code, transaction_item_category:transaction_item_category_id(name)",
            )
            .eq("owner_id", ownerId)
            .gte("executed_at", from)
            .lte("executed_at", to);

          if (error) {
            return {
              isError: true,
              content: [{ type: "text", text: `Supabase error: ${error.message}` }],
            };
          }

          const totals = new Map<string, number>();
          for (const row of data ?? []) {
            const category =
              (row.transaction_item_category as { name?: string } | null)?.name ??
              "Uncategorized";
            const key = `${category} (${row.currency_code})`;
            totals.set(key, (totals.get(key) ?? 0) + Number(row.amount ?? 0));
          }

          const result = [...totals.entries()]
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total);

          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        },
      );
    },
    {},
    {
      basePath: "/api",
      maxDuration: 60,
      verboseLogs: false,
    },
  );
}

async function dispatch(req: Request) {
  const auth = await authenticateMcpRequest(req);
  if (!auth) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }
  const handler = buildHandler(auth.ownerId);
  return handler(req);
}

export { dispatch as GET, dispatch as POST, dispatch as DELETE };
