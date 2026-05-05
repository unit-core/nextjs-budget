"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format, isThisYear, isToday, isYesterday } from "date-fns"
import Link from "next/link"

import type { AnyTransaction } from "@/lib/models/transaction"
import { cn } from "@/lib/utils"

import { RowActions } from "./row-actions"

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

function totalsByCurrency(transaction: AnyTransaction) {
  const totals = new Map<string, number>()
  for (const item of transaction.transaction_items) {
    totals.set(item.currency_code, (totals.get(item.currency_code) ?? 0) + Number(item.amount))
  }
  return Array.from(totals.entries())
}

function primaryCategory(transaction: AnyTransaction): string | null {
  const first = transaction.transaction_items[0]?.transaction_item_category.transaction_item_category_group.name
  return first ?? null
}

function formatExecutedAt(value: string): string {
  const date = new Date(value)
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`
  if (isYesterday(date)) return "Yesterday"
  if (isThisYear(date)) return format(date, "MMM d")
  return format(date, "MMM d, yyyy")
}

export const columns: ColumnDef<AnyTransaction>[] = [
  {
    id: "transaction",
    header: "Transaction",
    cell: ({ row }) => {
      const category = primaryCategory(row.original)
      return (
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="h-10 w-10 shrink-0 rounded-md bg-muted"
          />
          <div className="min-w-0 flex flex-col">
            <Link
              href={`/transactions/${row.original.id}`}
              className="truncate font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            <span className="truncate text-sm text-muted-foreground">
              {category ?? "—"}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "executed_at",
    header: "Date",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatExecutedAt(row.getValue<string>("executed_at"))}
      </div>
    ),
  },
  {
    id: "total",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const totals = totalsByCurrency(row.original)
      const isIncome = row.original.transaction_type === "INCOME"
      if (totals.length === 0) return <div className="text-right text-muted-foreground">—</div>
      return (
        <div
          className={cn(
            "flex flex-col items-end font-medium tabular-nums",
            isIncome && "text-emerald-500",
          )}
        >
          {totals.map(([currency, amount]) => {
            const sign = isIncome ? "+" : "-"
            return (
              <span key={currency}>
                {sign}
                {formatAmount(Math.abs(amount), currency)}
              </span>
            )
          })}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions transaction={row.original} />,
  },
]
