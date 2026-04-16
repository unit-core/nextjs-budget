export function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
}

/**
 * Renders totals grouped by currency code, one line per currency.
 * Returns `fallback` when there are no entries.
 */
export function formatCurrencyTotals(
  totals: Record<string, number>,
  locale?: string,
  fallback = "0,00",
): string {
  const entries = Object.entries(totals)
  if (entries.length === 0) return fallback
  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency, locale))
    .join("\n")
}

export function formatLongDate(value: string | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatMonth(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, { year: "numeric", month: "long" })
}

export function formatWeekdayLong(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
