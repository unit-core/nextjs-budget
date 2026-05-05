"use client"

import * as React from "react"
import { Cell, Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { TransactionItemWithCategory } from "@/lib/models/transaction_item"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface TransactionSummaryProps {
  items: TransactionItemWithCategory[]
}

export function TransactionSummary({ items }: TransactionSummaryProps) {
  const currencies = React.useMemo(() => {
    const set = new Set<string>()
    for (const it of items) set.add(it.currency_code)
    return Array.from(set)
  }, [items])

  const [currency, setCurrency] = React.useState(currencies[0] ?? "USD")
  const [hovered, setHovered] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!currencies.includes(currency) && currencies[0]) {
      setCurrency(currencies[0])
    }
  }, [currencies, currency])

  const filtered = React.useMemo(
    () => items.filter((i) => i.currency_code === currency),
    [items, currency],
  )

  const total = filtered.reduce((sum, i) => sum + Number(i.amount), 0)

  const byCategory = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const i of filtered) {
      const name = i.transaction_item_category.name
      map.set(name, (map.get(name) ?? 0) + Number(i.amount))
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    )
  }, [filtered])

  const chartConfig = React.useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {}
    byCategory.forEach((c, idx) => {
      cfg[c.name] = {
        label: c.name,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }
    })
    return cfg
  }, [byCategory])

  const chartData = React.useMemo(
    () =>
      byCategory.map((c, idx) => ({
        ...c,
        fill: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [byCategory],
  )

  const fullFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  })
  const compactFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  })

  return (
    <div className="flex flex-col w-full gap-3">
      {currencies.length > 1 && (
        <ToggleGroup
          type="single"
          value={currency}
          onValueChange={(v) => v && setCurrency(v)}
          variant="outline"
          size="sm"
        >
          {currencies.map((c) => (
            <ToggleGroupItem key={c} value={c} aria-label={c}>
              {c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
          <CardDescription>
            {byCategory.length}{" "}
            {byCategory.length === 1 ? "category" : "categories"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square w-full max-w-[260px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {fullFormatter.format(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="65%"
                    outerRadius="100%"
                    strokeWidth={2}
                    paddingAngle={1}
                    isAnimationActive={false}
                  >
                    {chartData.map((c) => (
                      <Cell
                        key={c.name}
                        fill={c.fill}
                        opacity={
                          hovered && hovered !== c.name ? 0.3 : 1
                        }
                        style={{ transition: "opacity 150ms" }}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (
                          !viewBox ||
                          !("cx" in viewBox) ||
                          !("cy" in viewBox)
                        ) {
                          return null
                        }
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 10}
                              className="fill-muted-foreground text-xs"
                            >
                              Spent
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 14}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {compactFormatter.format(total)}
                            </tspan>
                          </text>
                        )
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>

              <ul className="flex flex-col gap-2.5 text-sm">
                {byCategory.map((c, idx) => {
                  const percent = total > 0 ? (c.value / total) * 100 : 0
                  return (
                    <li
                      key={c.name}
                      onMouseEnter={() => setHovered(c.name)}
                      onMouseLeave={() => setHovered(null)}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/60"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{
                          backgroundColor:
                            CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="truncate">{c.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {percent.toFixed(percent < 1 ? 1 : 0)}%
                      </span>
                      <span className="font-medium tabular-nums">
                        {fullFormatter.format(c.value)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
