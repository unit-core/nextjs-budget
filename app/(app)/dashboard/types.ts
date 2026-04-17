/**
 * Types mirror the Supabase tables `public.transactions` and
 * `public.transaction_items`. All selected columns are NOT NULL in the
 * database, so the TS types are non-nullable too.
 */

export const CONFIRMED_STATUS = "CONFIRMED"

/** Known `transactions.status` values. Falls back to `string` for forward-compat. */
export type TransactionStatus = "IDLE" | "CONFIRMED" | "UNDERSTANDING" | (string & {})

/** Known `transactions.transaction_type` values. Falls back to `string`. */
export type TransactionType = "EXPENSE" | "INCOME" | (string & {})

/** Row shape from `public.transaction_item_category_groups`. owner_id null = system group (read-only). */
export interface TransactionItemCategoryGroup {
  id: string
  name: string
  description: string
  owner_id: string | null
  type: string
}

/** Row shape from `public.transaction_item_categories`. owner_id null = system category (read-only). */
export interface TransactionItemCategory {
  id: string
  name: string
  description: string
  owner_id: string | null
  category_group: TransactionItemCategoryGroup
}

/** Row shape selected from `public.transaction_items`. */
export interface TransactionItem {
  id: string
  name: string
  amount: number
  currency_code: string
  transaction_item_categories: TransactionItemCategory | null
  executed_at: string
}

/** Row shape selected from `public.transactions`, joined with its items. */
export interface Transaction {
  id: string
  name: string
  status: TransactionStatus
  transaction_type: TransactionType
  executed_at: string
  transaction_items: TransactionItem[]
}

/** Input shape for <ChartAreaInteractive />. */
export interface ChartItem {
  executed_at: string
  currency_code: string
  amount: number
}

/** Row shape selected from `public.transaction_item_templates`. */
export interface TransactionItemTemplate {
  id: string
  created_at: string
  transaction_template_id: string
  transaction_folder_id: string
  owner_id: string
  name: string
  amount: number
  currency_code: string
  category: string
}

/** Row shape selected from `public.transaction_templates`, joined with its item templates. */
export interface TransactionTemplate {
  id: string
  created_at: string
  owner_id: string
  folder_id: string
  name: string
  transaction_type: TransactionType
  transaction_item_templates: TransactionItemTemplate[]
}
