export type TransactionItemCategoryGroupType = 'EXPENSE' | 'INCOME'

export interface BaseTransactionItemCategoryGroup {
  id: string
  created_at: string
  name: string
  description: string
  owner_id: string | null
  type: TransactionItemCategoryGroupType
}

export type TransactionItemCategoryGroupInsert = Omit<
  BaseTransactionItemCategoryGroup,
  'id' | 'created_at' | 'name' | 'description' | 'owner_id' | 'type'
> & {
  id?: string
  created_at?: string
  name?: string
  description?: string
  owner_id?: string | null
  type?: string
}

export type TransactionItemCategoryGroupUpdate = Partial<TransactionItemCategoryGroupInsert>
