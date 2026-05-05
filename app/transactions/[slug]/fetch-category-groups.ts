import "server-only"

import type { AnyTransactionItemCategoryGroup } from "@/lib/models/transaction_item_category_group"
import { createClient } from "@/lib/supabase/server"

const CATEGORY_GROUPS_SELECT = `
  *,
  categories:transaction_item_categories (*)
`

export async function fetchCategoryGroups(): Promise<AnyTransactionItemCategoryGroup[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transaction_item_category_groups")
    .select(CATEGORY_GROUPS_SELECT)
    .order("name", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AnyTransactionItemCategoryGroup[]
}
