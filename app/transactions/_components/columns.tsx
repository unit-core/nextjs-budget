"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { AnyTransaction } from "@/lib/models/transaction"

import { RowActions } from "./row-actions"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
})

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

function uniqueCategories(transaction: AnyTransaction) {
  const set = new Set<string>()
  for (const item of transaction.transaction_items) {
    set.add(item.transaction_item_category.name)
  }
  return Array.from(set)
}

export const columns: ColumnDef<AnyTransaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "executed_at",
    header: "Date",
    cell: ({ row }) => (
      <div>{dateFormatter.format(new Date(row.getValue<string>("executed_at")))}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/transactions/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    id: "categories",
    header: "Categories",
    cell: ({ row }) => {
      const categories = uniqueCategories(row.original)
      if (categories.length === 0) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <Badge key={c} variant="secondary">{c}</Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status")
      const variant =
        status === "CONFIRMED" ? "default"
        : status === "PARSE_ERROR" || status === "UNSUPPORTED_DOCUMENT" ? "destructive"
        : "secondary"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    id: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const totals = totalsByCurrency(row.original)
      if (totals.length === 0) return <div className="text-right text-muted-foreground">—</div>
      return (
        <div className="flex flex-col items-end font-medium">
          {totals.map(([currency, amount]) => (
            <span key={currency}>{formatAmount(amount, currency)}</span>
          ))}
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
