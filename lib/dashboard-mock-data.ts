import type { DateTexts, DateValues } from "@/components/section-cards"

// Fixed reference date keeps every screenshot identical across runs.
// UTC noon avoids timezone drift in toLocaleDateString.
const REFERENCE_DATE = new Date(Date.UTC(2026, 2, 15, 12, 0, 0)) // 2026-03-15

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
}

function joinCurrencies(totals: Record<string, number>, locale: string) {
  const keys = Object.keys(totals)
  if (keys.length === 0) return "0,00"
  return keys.map((c) => formatCurrency(totals[c], c, locale)).join("\n")
}

function monthRange(date: Date) {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
  }
}

// Stable per-category totals (EUR).
const CATEGORY_TOTALS: Array<{
  key: string
  amount: number
  txs: Array<{ name: string; amount: number }>
}> = [
  { key: "GROCERIES",        amount: 412.80,  txs: [{ name: "Carrefour", amount: 186.40 }, { name: "Lidl", amount: 142.30 }, { name: "Local market", amount: 84.10 }] },
  { key: "RESTAURANTS",      amount: 238.50,  txs: [{ name: "Dinner with friends", amount: 96.00 }, { name: "Lunch", amount: 42.50 }, { name: "Brunch", amount: 100.00 }] },
  { key: "RENT",             amount: 1200.00, txs: [{ name: "Monthly rent", amount: 1200.00 }] },
  { key: "UTILITIES",        amount: 148.20,  txs: [{ name: "Electricity", amount: 68.40 }, { name: "Water", amount: 34.80 }, { name: "Gas", amount: 45.00 }] },
  { key: "PUBLIC_TRANSPORT", amount: 60.00,   txs: [{ name: "Monthly pass", amount: 60.00 }] },
  { key: "SUBSCRIPTIONS",    amount: 42.97,   txs: [{ name: "Spotify", amount: 10.99 }, { name: "Netflix", amount: 15.99 }, { name: "iCloud", amount: 15.99 }] },
  { key: "PHARMACY",         amount: 34.60,   txs: [{ name: "Vitamins", amount: 22.10 }, { name: "Painkillers", amount: 12.50 }] },
]

const MONTH_TOTAL_EUR = CATEGORY_TOTALS.reduce((a, c) => a + c.amount, 0)
const TODAY_TOTAL_EUR = 27.40

// 90 days ending at REFERENCE_DATE — seeded pseudo-random for determinism.
function buildChartItems() {
  const items: Array<{ executed_at: string; currency_code: string; amount: number }> = []
  const end = REFERENCE_DATE.getTime()
  const day = 24 * 60 * 60 * 1000
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 89; i >= 0; i--) {
    const d = new Date(end - i * day)
    const base = 25 + Math.sin(i / 6) * 14 + rand() * 22
    items.push({
      executed_at: d.toISOString(),
      currency_code: "EUR",
      amount: Math.round(base * 100) / 100,
    })
    if (rand() > 0.7) {
      items.push({
        executed_at: d.toISOString(),
        currency_code: "EUR",
        amount: Math.round(rand() * 40 * 100) / 100,
      })
    }
  }
  return items
}

export interface MockDashboardData {
  texts: DateTexts
  values: DateValues
  categories: Array<{
    name: string
    description?: string
    amount: string
    transactions: Array<{ name: string; amount: string }>
  }>
  chartItems: Array<{ executed_at: string; currency_code: string; amount: number }>
}

export function getMockDashboardData(
  locale: string,
  tCategoryName: (key: string) => string,
  tCategoryDesc: (key: string) => string | undefined,
): MockDashboardData {
  const { start, end } = monthRange(REFERENCE_DATE)

  const texts: DateTexts = {
    today: REFERENCE_DATE.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    month: REFERENCE_DATE.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
    }),
    monthRange: `${start.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} - ${end.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
  }

  const transactionsCount = CATEGORY_TOTALS.reduce((a, c) => a + c.txs.length, 0)
  const itemsCount = transactionsCount + 4

  const values: DateValues = {
    today: joinCurrencies({ EUR: TODAY_TOTAL_EUR }, locale),
    month: joinCurrencies({ EUR: MONTH_TOTAL_EUR }, locale),
    transactions_number: transactionsCount,
    items_number: itemsCount,
  }

  const categories = CATEGORY_TOTALS.map((c) => ({
    name: tCategoryName(c.key),
    description: tCategoryDesc(c.key),
    amount: formatCurrency(c.amount, "EUR", locale),
    transactions: c.txs.map((tx) => ({
      name: tx.name,
      amount: formatCurrency(tx.amount, "EUR", locale),
    })),
  }))

  return { texts, values, categories, chartItems: buildChartItems() }
}
