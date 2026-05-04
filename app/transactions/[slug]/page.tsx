import { notFound } from "next/navigation"

import type { AnyTransaction } from "@/lib/models/transaction"
import { createClient } from "@/lib/supabase/server"

import { TRANSACTIONS_SELECT } from "../query"
import { TransactionForm } from "./_components/transaction-form"

async function fetchTransaction(slug: string): Promise<AnyTransaction | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTIONS_SELECT)
    .eq("id", slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as AnyTransaction | null) ?? null
}

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const transaction = await fetchTransaction(slug)

  if (!transaction) notFound()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-6 sm:px-6 sm:pt-10">
      <TransactionForm transaction={transaction} />
    </div>
  )
}
