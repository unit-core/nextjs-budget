"use client"

import type { Row } from "@tanstack/react-table"

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
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
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
  for (const item of transaction.transaction_items) set.add(item.transaction_item_category.name)
  return Array.from(set)
}

interface TransactionCardProps {
  row: Row<AnyTransaction>
}

export function TransactionCard({ row }: TransactionCardProps) {
  const t = row.original
  const totals = totalsByCurrency(t)
  const categories = uniqueCategories(t)

  return (
    <div
      data-state={row.getIsSelected() && "selected"}
      className="flex gap-3 mx-2 rounded-md border bg-card p-4 data-[state=selected]:bg-muted"
    >
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        className="mt-1"
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              {dateFormatter.format(new Date(t.executed_at))}
            </div>
            <div className="font-medium truncate">{t.name || "—"}</div>
          </div>
          <div className="flex flex-col items-end font-medium shrink-0">
            {totals.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              totals.map(([c, a]) => <span key={c}>{formatAmount(a, c)}</span>)
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {t.status !== "CONFIRMED" && (
            <Badge
              variant={
                t.status === "PARSE_ERROR" || t.status === "UNSUPPORTED_DOCUMENT"
                  ? "destructive"
                  : "secondary"
              }
            >
              {t.status}
            </Badge>
          )}
          {categories.map((c) => (
            <Badge key={c} variant="secondary">{c}</Badge>
          ))}
        </div>
      </div>
      <RowActions transaction={t} />
    </div>
  )
}
