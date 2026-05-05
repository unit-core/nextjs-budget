import { notFound } from "next/navigation"
import { fetchTransactionById } from "./fetch-transaction"
import { TransactionSummary } from "./_components/transaction-summary"
import { ItemsTable } from "./_components/items-table"

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const transaction = await fetchTransactionById(slug)

  if (!transaction) notFound()

  const items = transaction.transaction_items

  return (
    <div className="flex flex-col flex-1 items-center py-6">
      <div className="relative w-full max-w-5xl flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">{transaction.executed_at}</span>
          <span className="text-5xl font-bold tabular-nums">
            {transaction.name}
          </span>
        </div>
        <TransactionSummary items={items} />
        <ItemsTable items={items} transactionId={transaction.id} />
      </div>
    </div>
  )
}
