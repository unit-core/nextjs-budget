export interface BaseTransactionItemCategory {
  id: string
  created_at: string
  transaction_item_category_group_id: string
  owner_id: string | null
  name: string
  description: string
}

export type TransactionItemCategoryInsert = Omit<
  BaseTransactionItemCategory,
  'id' | 'created_at' | 'owner_id' | 'name'
> & {
  id?: string
  created_at?: string
  owner_id?: string | null
  name?: string
}

export type TransactionItemCategoryUpdate = Partial<TransactionItemCategoryInsert>
