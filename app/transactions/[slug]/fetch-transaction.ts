import "server-only"

import type { AnyTransaction } from "@/lib/models/transaction"
import { createClient } from "@/lib/supabase/server"

import { TRANSACTIONS_SELECT } from "../query"

export async function fetchTransactionById(
  id: string,
): Promise<AnyTransaction | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTIONS_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as AnyTransaction | null) ?? null
}
