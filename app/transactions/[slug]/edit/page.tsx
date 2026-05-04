import { notFound } from "next/navigation"

import { fetchTransactionById } from "../fetch-transaction"
import { TransactionForm } from "./_components/transaction-form"

export default async function TransactionEditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const transaction = await fetchTransactionById(slug)

  if (!transaction) notFound()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-6 sm:px-6 sm:pt-10">
      <TransactionForm transaction={transaction} />
    </div>
  )
}
