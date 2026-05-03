import { createClient } from "@/lib/supabase/server"
import type { AnyTransaction } from "@/lib/models/transaction"

import type { TransactionsQuery } from "./parse-search-params"

export const TRANSACTIONS_SELECT = `
  *,
  transaction_items (
    *,
    transaction_item_category:transaction_item_categories (
      *,
      transaction_item_category_group:transaction_item_category_groups (*)
    )
  )
`

export interface TransactionsPage {
  data: AnyTransaction[]
  count: number
  pageNumber: number
  pageSize: number
  pageCount: number
}

export async function fetchTransactionsPage(
  query: TransactionsQuery,
): Promise<TransactionsPage> {
  const { pageSize, pageNumber, executedAtFrom, executedAtTo, searchName } = query
  const from = (pageNumber - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  let request = supabase
    .from("transactions")
    .select(TRANSACTIONS_SELECT, { count: "exact" })
    .order("executed_at", { ascending: false })
    .range(from, to)

  if (executedAtFrom) request = request.gte("executed_at", executedAtFrom)
  if (executedAtTo) request = request.lte("executed_at", executedAtTo)
  if (searchName) request = request.ilike("name", `%${searchName}%`)

  const { data, error, count } = await request
  if (error) throw error

  const total = count ?? 0
  return {
    data: (data ?? []) as AnyTransaction[],
    count: total,
    pageNumber,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  }
}
