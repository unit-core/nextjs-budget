import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { TokensClient } from "./tokens-client";

async function TokensList() {
  const supabase = await createClient();

  const { data: tokens } = await supabase
    .from("api_tokens")
    .select("id, name, created_at, last_used_at")
    .order("created_at", { ascending: false });

  return <TokensClient tokens={tokens ?? []} />;
}

export default function TokensPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tokens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use these tokens to access your budget data via the API. The token is
          shown once — copy it immediately.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <TokensList />
      </Suspense>
    </div>
  );
}
