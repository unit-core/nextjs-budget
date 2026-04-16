import type { getTranslations } from "next-intl/server"
import type { z } from "zod"

import type { schema as allTransactionsSchema } from "@/components/all-transactions-data-table"
import type { DateValues } from "@/components/section-cards"

import type { Transaction } from "../types"
import {
  type CategoryAggregate,
  type MonthAggregate,
  sumItemsByCurrency,
} from "./aggregate"
import { formatCurrencyTotals, formatLongDate } from "./format"

type Translator = Awaited<ReturnType<typeof getTranslations>>

export type TransactionRow = z.infer<typeof allTransactionsSchema>

export interface CategoryRow {
  name: string
  description?: string
  amount: string
  transactions: { name: string; amount: string }[]
}

export function buildSummary(agg: MonthAggregate, locale: string): DateValues {
  return {
    today: formatCurrencyTotals(agg.todayTotals, locale),
    month: formatCurrencyTotals(agg.monthTotals, locale),
    transactions_number: agg.transactionsCount,
    items_number: agg.itemsCount,
  }
}

export function buildCategoryRows(
  categories: CategoryAggregate[],
  locale: string,
  translateCategory: Translator,
): CategoryRow[] {
  return categories.map((entry) => {
    const nameKey = `${entry.category}.name`
    const descriptionKey = `${entry.category}.description`
    return {
      name: translateCategory.has(nameKey)
        ? translateCategory(nameKey)
        : entry.category,
      description: translateCategory.has(descriptionKey)
        ? translateCategory(descriptionKey)
        : undefined,
      amount: formatCurrencyTotals(entry.totals, locale),
      transactions: entry.transactions.map((tx) => ({
        name: tx.name,
        amount: formatCurrencyTotals(tx.totals, locale),
      })),
    }
  })
}

export function buildTransactionRow(tx: Transaction, locale: string): TransactionRow {
  return {
    id: tx.id,
    name: tx.name.length > 0 ? tx.name : "-",
    status: tx.status,
    transaction_type: tx.transaction_type,
    executed_at: formatLongDate(tx.executed_at, locale),
    amount: formatCurrencyTotals(
      sumItemsByCurrency(tx.transaction_items),
      locale,
      "—",
    ),
  }
}
