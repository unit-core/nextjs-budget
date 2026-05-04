"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export async function deleteTransactions(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().in("id", ids)
  if (error) throw error
  revalidatePath("/transactions")
}
