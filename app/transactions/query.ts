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
