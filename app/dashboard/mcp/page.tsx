import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { McpTokensClient } from "./tokens-client";

export default async function McpTokensPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth/login");

  const { data: tokens } = await supabase
    .from("mcp_tokens")
    .select("id, name, created_at, last_used_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">MCP Tokens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use these tokens to connect Claude Desktop or Claude Code to your
          budget data via MCP. The token is shown once — copy it immediately.
        </p>
      </div>
      <McpTokensClient tokens={tokens ?? []} />
    </div>
  );
}
