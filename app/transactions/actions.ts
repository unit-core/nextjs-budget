"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { TransactionStatus, TransactionType } from "@/lib/models/transaction"

export async function deleteTransactions(ids: string[]) {
  if (ids.length === 0) return
  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().in("id", ids)
  if (error) throw error
  revalidatePath("/transactions")
}

export interface TransactionItemFormValues {
  id: string
  name: string
  amount: number
  currency_code: string
}

export interface TransactionFormValues {
  name: string
  executed_at: string
  status: TransactionStatus
  transaction_type: TransactionType
  items: TransactionItemFormValues[]
}

export async function updateTransaction(id: string, values: TransactionFormValues) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("transactions")
    .update({
      name: values.name,
      executed_at: values.executed_at,
      status: values.status,
      transaction_type: values.transaction_type,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)

  if (values.items.length > 0) {
    const updates = values.items.map((item) =>
      supabase
        .from("transaction_items")
        .update({
          name: item.name,
          amount: item.amount,
          currency_code: item.currency_code,
        })
        .eq("id", item.id),
    )
    const results = await Promise.all(updates)
    const itemError = results.find((r) => r.error)?.error
    if (itemError) throw new Error(itemError.message)
  }

  revalidatePath("/transactions")
  revalidatePath(`/transactions/${id}`)
}

export async function deleteTransactionItems(ids: string[], transactionId: string) {
  if (ids.length === 0) return
  const supabase = await createClient()
  const { error } = await supabase.from("transaction_items").delete().in("id", ids)
  if (error) throw new Error(error.message)
  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath("/transactions")
}

export async function deleteTransactionAndRedirect(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/transactions")
  redirect("/transactions")
}
