import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Service supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): { plaintext: string; hash: string } {
  const plaintext = `tok_${randomBytes(32).toString("base64url")}`;
  return { plaintext, hash: hashToken(plaintext) };
}

export async function authenticateRequest(
  req: Request,
): Promise<{ ownerId: string } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("api_tokens")
    .select("id, owner_id")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) return null;

  void supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => undefined);

  return { ownerId: data.owner_id };
}
