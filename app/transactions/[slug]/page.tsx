import { ArrowDownLeft, ArrowUpRight, Pencil } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"

import { CategoryPie } from "./_components/category-pie"
import { PrintButton } from "./_components/print-button"
import { fetchTransactionById } from "./fetch-transaction"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

const formatters = new Map<string, Intl.NumberFormat>()
function formatAmount(amount: number, currency: string) {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency })
    formatters.set(currency, f)
  }
  return f.format(amount)
}

const CHART_PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

function colorFor(index: number) {
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "CONFIRMED") return "default"
  if (status === "PARSE_ERROR" || status === "UNSUPPORTED_DOCUMENT")
    return "destructive"
  return "secondary"
}

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const transaction = await fetchTransactionById(slug)

  if (!transaction) notFound()

  const items = transaction.transaction_items
  const isIncome = transaction.transaction_type === "INCOME"

  // Group totals by currency
  const totalsByCurrency = new Map<string, number>()
  for (const item of items) {
    totalsByCurrency.set(
      item.currency_code,
      (totalsByCurrency.get(item.currency_code) ?? 0) + Number(item.amount),
    )
  }
  const currencyEntries = Array.from(totalsByCurrency.entries()).sort(
    (a, b) => b[1] - a[1],
  )
  const primaryCurrency = currencyEntries[0]?.[0] ?? "USD"

  // Group by category in primary currency
  const byCategory = new Map<string, number>()
  for (const item of items) {
    if (item.currency_code !== primaryCurrency) continue
    const key = item.transaction_item_category?.name ?? "Uncategorized"
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(item.amount))
  }
  const categoryEntries = Array.from(byCategory.entries()).sort(
    (a, b) => b[1] - a[1],
  )
  const primaryTotal = categoryEntries.reduce((sum, [, v]) => sum + v, 0)

  const chartData = categoryEntries.map(([category, amount], i) => ({
    category,
    amount,
    fill: colorFor(i),
  }))
  const chartConfig: ChartConfig = Object.fromEntries(
    categoryEntries.map(([category], i) => [
      category,
      { label: category, color: colorFor(i) },
    ]),
  ) satisfies ChartConfig

  const biggestItem = [...items].sort(
    (a, b) => Number(b.amount) - Number(a.amount),
  )[0]

  // Group items by category for display
  type CategoryGroup = {
    name: string
    color: string
    total: number
    share: number
    items: typeof items
  }
  const itemsByCategory = new Map<string, typeof items>()
  for (const item of items) {
    const key = item.transaction_item_category?.name ?? "Uncategorized"
    const arr = itemsByCategory.get(key) ?? []
    arr.push(item)
    itemsByCategory.set(key, arr)
  }
  const groups: CategoryGroup[] = categoryEntries.map(([name, total], i) => ({
    name,
    color: colorFor(i),
    total,
    share: primaryTotal > 0 ? total / primaryTotal : 0,
    items: (itemsByCategory.get(name) ?? [])
      .slice()
      .sort((a, b) => Number(b.amount) - Number(a.amount)),
  }))

  return (
    <div className="bg-muted/30 min-h-screen print:bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 print:max-w-none print:p-0">
        <article className="bg-background overflow-hidden rounded-lg border shadow-sm print:border-none print:shadow-none">
          <div className="space-y-6 p-6 sm:p-8 print:p-6">
            {/* Header */}
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-muted-foreground text-xs uppercase tracking-wider">
                  Transaction
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {transaction.name || "Untitled"}
                </h1>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span>{dateFormatter.format(new Date(transaction.executed_at))}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="font-mono text-xs">{transaction.id}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    isIncome
                      ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "border-rose-500/40 text-rose-600 dark:text-rose-400"
                  }
                >
                  {isIncome ? (
                    <ArrowDownLeft className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  )}
                  {isIncome ? "Income" : "Expense"}
                </Badge>
                <Badge variant={statusVariant(transaction.status)}>
                  {transaction.status}
                </Badge>
                <div className="ml-1 flex items-center gap-2 print:hidden">
                  <PrintButton />
                  <Button asChild size="sm">
                    <Link href={`/transactions/${transaction.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </header>

            <Separator />

            {/* KPIs */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-0 bg-muted/40 shadow-none">
                <CardContent className="space-y-1 p-4">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    Total
                  </div>
                  <div className="space-y-0.5">
                    {currencyEntries.length > 0 ? (
                      currencyEntries.map(([currency, amount]) => (
                        <div
                          key={currency}
                          className={
                            "text-xl font-semibold tracking-tight " +
                            (isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground")
                          }
                        >
                          {isIncome ? "+" : ""}
                          {formatAmount(amount, currency)}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-xl">—</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-muted/40 shadow-none">
                <CardContent className="space-y-1 p-4">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    Items
                  </div>
                  <div className="text-xl font-semibold tracking-tight">
                    {items.length}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    in {categoryEntries.length} categor
                    {categoryEntries.length === 1 ? "y" : "ies"}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-muted/40 shadow-none">
                <CardContent className="space-y-1 p-4">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    Largest item
                  </div>
                  <div className="truncate text-xl font-semibold tracking-tight">
                    {biggestItem
                      ? formatAmount(
                          Number(biggestItem.amount),
                          biggestItem.currency_code,
                        )
                      : "—"}
                  </div>
                  <div
                    className="text-muted-foreground truncate text-xs"
                    title={biggestItem?.name}
                  >
                    {biggestItem?.name ?? "—"}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Breakdown */}
            {chartData.length > 0 && (
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-[260px_1fr] sm:items-center">
                <CategoryPie
                  data={chartData}
                  total={primaryTotal}
                  currency={primaryCurrency}
                  config={chartConfig}
                />
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs uppercase tracking-wider">
                    By category
                  </div>
                  <ul className="space-y-1.5">
                    {categoryEntries.map(([name, amount], i) => {
                      const share = primaryTotal > 0 ? amount / primaryTotal : 0
                      return (
                        <li key={name} className="flex items-center gap-3 text-sm">
                          <span
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ background: colorFor(i) }}
                          />
                          <span className="flex-1 truncate">{name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {(share * 100).toFixed(0)}%
                          </span>
                          <span className="w-20 text-right font-mono text-sm tabular-nums">
                            {formatAmount(amount, primaryCurrency)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            )}

            <Separator />

            {/* Items by category */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wider">
                  Items by category
                </h2>
                <span className="text-muted-foreground text-xs">
                  {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
                  {groups.length} categor{groups.length === 1 ? "y" : "ies"}
                </span>
              </div>

              {groups.length === 0 ? (
                <p className="text-muted-foreground text-sm">No items.</p>
              ) : (
                <div className="divide-y rounded-md border">
                  {groups.map((group) => (
                    <div key={group.name} className="break-inside-avoid">
                      <div className="bg-muted/40 flex items-center gap-3 px-4 py-2">
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ background: group.color }}
                        />
                        <span className="flex-1 truncate text-sm font-medium">
                          {group.name}
                        </span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {group.items.length} ·{" "}
                          {(group.share * 100).toFixed(0)}%
                        </span>
                        <span className="w-24 text-right font-mono text-sm font-medium tabular-nums">
                          {formatAmount(group.total, primaryCurrency)}
                        </span>
                      </div>
                      <ul className="divide-y">
                        {group.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-1.5 text-sm"
                          >
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="text-muted-foreground w-24 text-right font-mono tabular-nums">
                              {formatAmount(
                                Number(item.amount),
                                item.currency_code,
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
