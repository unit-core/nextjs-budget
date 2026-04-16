import {
  CONFIRMED_STATUS,
  type ChartItem,
  type Transaction,
  type TransactionItem,
} from "../types"
import { type DateRange, isSameDay, isWithinRange } from "./date-range"

export interface CategoryTransaction {
  id: string
  name: string
  totals: Record<string, number>
}

export interface CategoryAggregate {
  category: string
  totals: Record<string, number>
  transactions: CategoryTransaction[]
}

export interface MonthAggregate {
  transactionsCount: number
  itemsCount: number
  monthTotals: Record<string, number>
  todayTotals: Record<string, number>
  categories: CategoryAggregate[]
}

function addAmount(acc: Record<string, number>, key: string, value: number): void {
  acc[key] = (acc[key] ?? 0) + value
}

export function isConfirmed(tx: Transaction): boolean {
  return tx.status === CONFIRMED_STATUS
}

export function confirmedInRange(
  transactions: Transaction[],
  range: DateRange,
): Transaction[] {
  return transactions.filter(
    (tx) => isConfirmed(tx) && isWithinRange(tx.executed_at, range),
  )
}

/**
 * Walks each item in each transaction once to build all month-scoped totals:
 * per-currency, per-day, per-category (with nested per-transaction totals).
 */
export function aggregateMonth(
  transactions: Transaction[],
  today: Date,
): MonthAggregate {
  const monthTotals: Record<string, number> = {}
  const todayTotals: Record<string, number> = {}
  const categoryMap = new Map<string, CategoryAggregate>()
  const txIndex = new Map<string, Map<string, CategoryTransaction>>()
  let itemsCount = 0

  for (const tx of transactions) {
    const executedToday = isSameDay(tx.executed_at, today)

    for (const item of tx.transaction_items) {
      itemsCount += 1
      addAmount(monthTotals, item.currency_code, item.amount)
      if (executedToday) addAmount(todayTotals, item.currency_code, item.amount)

      let categoryEntry = categoryMap.get(item.category)
      if (!categoryEntry) {
        categoryEntry = { category: item.category, totals: {}, transactions: [] }
        categoryMap.set(item.category, categoryEntry)
        txIndex.set(item.category, new Map())
      }
      addAmount(categoryEntry.totals, item.currency_code, item.amount)

      const txMap = txIndex.get(item.category)!
      let txEntry = txMap.get(tx.id)
      if (!txEntry) {
        txEntry = { id: tx.id, name: tx.name || "-", totals: {} }
        txMap.set(tx.id, txEntry)
        categoryEntry.transactions.push(txEntry)
      }
      addAmount(txEntry.totals, item.currency_code, item.amount)
    }
  }

  return {
    transactionsCount: transactions.length,
    itemsCount,
    monthTotals,
    todayTotals,
    categories: [...categoryMap.values()],
  }
}

export function sumItemsByCurrency(items: TransactionItem[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const item of items) {
    totals[item.currency_code] = (totals[item.currency_code] ?? 0) + item.amount
  }
  return totals
}

export function buildChartItems(transactions: Transaction[]): ChartItem[] {
  return transactions.filter(isConfirmed).flatMap((tx) =>
    tx.transaction_items.map<ChartItem>((item) => ({
      executed_at: item.executed_at,
      currency_code: item.currency_code,
      amount: item.amount,
    })),
  )
}
