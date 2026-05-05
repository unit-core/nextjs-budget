"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import type { TransactionItemWithCategory } from "@/lib/models/transaction_item"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

const UNCATEGORIZED = "Uncategorized"

type CurrencyBreakdown = {
  currency: string
  total: number
  byCategory: { category: string; amount: number }[]
}

function startOfCurrentMonthUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function startOfNextMonthUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString()
}

function endOfCurrentMonthUTC(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 1).toISOString()
}

function currentMonthTransactionsHref(): string {
  const params = new URLSearchParams()
  params.set("filter[executed_at]", `${startOfCurrentMonthUTC()},${endOfCurrentMonthUTC()}`)
  return `/transactions?${params.toString()}`
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const chartConfig = {
  amount: {
    label: "Amount",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

function CurrencyChart({ breakdown }: { breakdown: CurrencyBreakdown }) {
  const data = [...breakdown.byCategory].sort((a, b) => a.amount - b.amount)
  const height = Math.max(60, data.length * 36 + 12)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {breakdown.currency}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {formatAmount(breakdown.total, breakdown.currency)}
        </span>
      </div>
      <ChartContainer config={chartConfig} style={{ height }} className="w-full">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 48, top: 12, bottom: 0 }}
        >
          <YAxis dataKey="category" type="category" hide />
          <XAxis dataKey="amount" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" hideLabel />}
          />
          <Bar dataKey="amount" barSize={10} radius={3} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
            <LabelList
              dataKey="category"
              content={({ x, y, value }) => (
                <text
                  x={Number(x)}
                  y={Number(y) - 4}
                  fontSize={10}
                  textAnchor="start"
                  className="fill-muted-foreground"
                >
                  {value}
                </text>
              )}
            />
            <LabelList
              dataKey="amount"
              position="right"
              offset={6}
              className="fill-foreground"
              fontSize={10}
              formatter={(value) => formatAmount(Number(value), breakdown.currency)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export function MonthlyTotal() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<TransactionItemWithCategory[]>([])

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
                name,
                type
              )
            )
          `
        )
        .gte("executed_at", startOfCurrentMonthUTC())
        .lt("executed_at", startOfNextMonthUTC())
        .returns<TransactionItemWithCategory[]>()

      if (cancelled) return
      if (!error) setItems(data ?? [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const breakdowns = useMemo<CurrencyBreakdown[]>(() => {
    const byCurrency = new Map<string, Map<string, number>>()
    for (const item of items) {
      const group = item.transaction_item_category?.transaction_item_category_group
      if (group?.type && group.type !== "EXPENSE") continue
      const category = group?.name?.trim() || UNCATEGORIZED
      const inner = byCurrency.get(item.currency_code) ?? new Map<string, number>()
      inner.set(category, (inner.get(category) ?? 0) + Number(item.amount))
      byCurrency.set(item.currency_code, inner)
    }

    return Array.from(byCurrency.entries())
      .map(([currency, inner]) => {
        const byCategory = Array.from(inner.entries()).map(([category, amount]) => ({
          category,
          amount,
        }))
        const total = byCategory.reduce((acc, c) => acc + c.amount, 0)
        return { currency, total, byCategory }
      })
      .sort((a, b) => b.total - a.total)
  }, [items])

  if (loading) {
    return (
      <div className="flex h-8 items-center px-3">
        <Skeleton className="h-4 w-20 rounded-md" />
      </div>
    )
  }

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date())

  const summary =
    breakdowns.length === 0
      ? "0 EUR"
      : breakdowns.map((b) => formatAmount(b.total, b.currency)).join(" · ")

  return (
    <HoverCard openDelay={50} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button size="sm" variant="link" asChild>
          <Link href={currentMonthTransactionsHref()}>
            <span>
              <span className="text-muted-foreground">{monthName}</span>
              {" "}
              {summary}
            </span>
          </Link>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="flex w-80 flex-col gap-4">
        {breakdowns.length === 0 ? (
          <div className="text-xs text-muted-foreground">No expenses this month</div>
        ) : (
          breakdowns.map((b) => <CurrencyChart key={b.currency} breakdown={b} />)
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
