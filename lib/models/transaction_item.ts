export interface BaseTransactionItem {
  id: string
  created_at: string
  executed_at: string
  transaction_id: string
  transaction_folder_id: string
  owner_id: string
  name: string
  amount: number
  currency_code: string
  transaction_item_category_id: string
}

export type TransactionItemInsert = Omit<
  BaseTransactionItem,
  'id' | 'created_at' | 'executed_at' | 'owner_id' | 'name' | 'amount' | 'currency_code'
> & {
  id?: string
  created_at?: string
  executed_at?: string
  owner_id?: string
  name?: string
  amount?: number
  currency_code?: string
}

export type TransactionItemUpdate = Partial<TransactionItemInsert>

import type { BaseTransactionItemCategory } from './transaction_item_category'
import type { BaseTransactionItemCategoryGroup } from './transaction_item_category_group'

export type TransactionItemWithCategory = BaseTransactionItem & {
  transaction_item_category: BaseTransactionItemCategory & {
    transaction_item_category_group: BaseTransactionItemCategoryGroup | null
  }
}
