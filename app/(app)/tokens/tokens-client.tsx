"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createMcpToken, revokeMcpToken } from "./actions";

interface TokenRow {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export function McpTokensClient({ tokens }: { tokens: TokenRow[] }) {
  const [name, setName] = useState("");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Enter a name first");
      return;
    }
    startTransition(async () => {
      try {
        const { plaintext } = await createMcpToken(name);
        setFreshToken(plaintext);
        setName("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create token");
      }
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      try {
        await revokeMcpToken(id);
        toast.success("Token revoked");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to revoke");
      }
    });
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Token name (e.g. Claude Desktop laptop)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
            />
            <Button onClick={handleCreate} disabled={pending}>
              Create
            </Button>
          </div>
          {freshToken && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/30 dark:border-amber-700">
              <div className="font-medium mb-1">Copy this token now — it will not be shown again:</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all bg-background px-2 py-1 rounded text-xs">
                  {freshToken}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(freshToken)}>
                  Copy
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFreshToken(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tokens yet.</p>
      ) : (
        <div className="space-y-2">
          {tokens.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(t.created_at).toLocaleString()}
                    {t.last_used_at
                      ? ` · Last used ${new Date(t.last_used_at).toLocaleString()}`
                      : " · Never used"}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevoke(t.id)}
                  disabled={pending}
                >
                  Revoke
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
