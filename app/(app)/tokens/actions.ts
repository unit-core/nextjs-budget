"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/supabase/mcp";

export async function createMcpToken(name: string): Promise<{ plaintext: string }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Not authenticated");

  const { plaintext, hash } = generateToken();

  const { error } = await supabase.from("mcp_tokens").insert({
    owner_id: userData.user.id,
    token_hash: hash,
    name: trimmed,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/tokens");
  return { plaintext };
}

export async function revokeMcpToken(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("mcp_tokens").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tokens");
}
