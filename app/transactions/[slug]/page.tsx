import { notFound } from "next/navigation"
import { fetchTransactionById } from "./fetch-transaction"
import { fetchCategoryGroups } from "./fetch-category-groups"
import { TransactionSummary } from "./_components/transaction-summary"
import { ItemsTable } from "./_components/items-table"

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [transaction, categoryGroups] = await Promise.all([
    fetchTransactionById(slug),
    fetchCategoryGroups(),
  ])

  if (!transaction) notFound()

  const items = transaction.transaction_items

  return (
    <div className="flex flex-col flex-1 items-center py-6 px-2">
      <div className="relative w-full max-w-5xl flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{transaction.executed_at}</span>
          <span className="text-5xl font-bold tabular-nums">
            {transaction.name}
          </span>
        </div>
        <TransactionSummary items={items} />
        <ItemsTable
          items={items}
          transactionId={transaction.id}
          categoryGroups={categoryGroups}
        />
      </div>
    </div>
  )
}
