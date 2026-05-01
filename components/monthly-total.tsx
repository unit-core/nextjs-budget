"use client"

import { useEffect, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import type { TransactionItemWithCategory } from "@/lib/models/transaction_item"

function startOfCurrentMonthUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function startOfNextMonthUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function MonthlyTotal() {
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("transaction_items")
        .select(
          `
            id,
            amount,
            currency_code,
            executed_at,
            transaction_item_category:transaction_item_categories (
              id,
              name,
              transaction_item_category_group:transaction_item_category_groups (
                id,
                type
              )
            )
          `
        )
        .gte("executed_at", startOfCurrentMonthUTC())
        .lt("executed_at", startOfNextMonthUTC())
        .returns<TransactionItemWithCategory[]>()

      if (cancelled) return
      if (error) {
        setLoading(false)
        return
      }

      const sums: Record<string, number> = {}
      for (const item of data ?? []) {
        const groupType = item.transaction_item_category?.transaction_item_category_group?.type
        if (groupType && groupType !== "EXPENSE") continue
        sums[item.currency_code] = (sums[item.currency_code] ?? 0) + Number(item.amount)
      }
      setTotals(sums)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex h-8 items-center px-3 text-xs text-muted-foreground">
      {loading ? (
        <Skeleton className="h-4 w-20 rounded-md" />
      ) : Object.entries(totals).length === 0 ? (
        "0 EUR"
      ) : (
        Object.entries(totals)
          .map(([currency, total]) => formatAmount(total, currency))
          .join(" · ")
      )}
    </div>
  )
}
