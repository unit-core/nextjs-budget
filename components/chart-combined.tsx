"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Label, Pie, PieChart, Sector } from "recharts"
import { useLocale, useTranslations } from "next-intl"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { CategoryAggregate } from "@/app/(app)/dashboard/_lib/aggregate"
import { formatCurrency } from "@/app/(app)/dashboard/_lib/format"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface DataItem {
  executed_at: string
  currency_code: string
  amount: number | string
  category_group_id: string
  category_group_name: string | null
}

interface Props {
  categories: CategoryAggregate[]
  items: DataItem[]
  selectedDate: Date
}

export function ChartCombined({ categories, items, selectedDate }: Props) {
  const locale = useLocale()
  const t = useTranslations("Dashboard")
  const tg = useTranslations("CategoryGroups")

  // --- currencies + totals from categories ---
  const { currencies, currencyTotals } = React.useMemo(() => {
    const set = new Set<string>()
    const totals: Record<string, number> = {}
    for (const cat of categories) {
      for (const [code, amount] of Object.entries(cat.totals)) {
        set.add(code)
        totals[code] = (totals[code] ?? 0) + amount
      }
    }
    return { currencies: Array.from(set), currencyTotals: totals }
  }, [categories])

  const [activeCurrency, setActiveCurrency] = React.useState<string>("")
  const currency = currencies.includes(activeCurrency) ? activeCurrency : (currencies[0] ?? "")

  // --- pie slices (also the canonical category order used for bar stacking + colors) ---
  const slices = React.useMemo(() => {
    return categories
      .filter((cat) => (cat.totals[currency] ?? 0) > 0)
      .map((cat, i) => {
        const key = cat.group?.name
        const nameKey = key ? (`${key}.name` as Parameters<typeof tg>[0]) : null
        const label = nameKey && tg.has(nameKey) ? tg(nameKey) : (key ?? t("noResults"))
        const colorKey = `cat_${i}`
        const groupId = cat.group?.id ?? "__uncategorized__"
        return {
          colorKey,
          label,
          groupId,
          amount: cat.totals[currency],
          fill: `var(--color-${colorKey})`,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [categories, currency, tg, t])

  const pieConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    slices.forEach((s, i) => {
      config[s.colorKey] = { label: s.label, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return config
  }, [slices])

  // Map groupId -> colorKey so bar stacks share colors with pie slices.
  const groupIdToColorKey = React.useMemo(() => {
    const map = new Map<string, string>()
    slices.forEach((s) => map.set(s.groupId, s.colorKey))
    return map
  }, [slices])

  // --- bar chart data (selected month, all days), stacked by category ---
  const barData = React.useMemo(() => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const dailyMap = new Map<string, Record<string, any>>()

    items.forEach((item) => {
      if ((item.currency_code || "Unknown") !== currency) return
      const date = new Date(item.executed_at)
      if (date < monthStart || date > monthEnd) return
      const dateKey = date.toISOString().split("T")[0]
      const colorKey = groupIdToColorKey.get(item.category_group_id)
      if (!colorKey) return
      const val = Number(item.amount) || 0
      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { date: dateKey })
      const row = dailyMap.get(dateKey)!
      row[colorKey] = (row[colorKey] || 0) + val
    })

    const allDates: Record<string, any>[] = []
    const cursor = new Date(monthStart)
    while (cursor <= monthEnd) {
      const dateKey = cursor.toISOString().split("T")[0]
      allDates.push(dailyMap.get(dateKey) ?? { date: dateKey })
      cursor.setDate(cursor.getDate() + 1)
    }
    return allDates
  }, [items, selectedDate, currency, groupIdToColorKey])

  const barConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = { views: { label: t("amount") } }
    slices.forEach((s, i) => {
      config[s.colorKey] = { label: s.label, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return config
  }, [slices, t])

  // Biggest slice first (slices already sorted desc).
  const activeIndex = 0
  const activeSlice = slices[activeIndex]

  const pieId = `pie-${currency}`

  const activeShape = React.useCallback(
    ({ outerRadius = 0, ...props }: any) => (
      <g>
        <Sector {...props} outerRadius={outerRadius + 10} />
        <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
      </g>
    ),
    [],
  )

  if (currencies.length === 0) return null

  return (
    <Card className="py-0 w-full">
      <ChartStyle id={pieId} config={pieConfig} />

      {/* Shared header */}
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>{t("activityByCurrency")}</CardTitle>
          <CardDescription className="capitalize">
            {selectedDate.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </CardDescription>
        </div>
        <div className="flex">
          {currencies.map((c) => (
            <button
              key={c}
              data-active={currency === c}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveCurrency(c)}
            >
              <span className="text-xs text-muted-foreground">{c}</span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(currencyTotals[c] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Charts row */}
      <div className="flex flex-col sm:flex-row">
        {/* Pie — 1/3 on desktop, full width on mobile, border-b on mobile / border-r on desktop */}
        <div className="flex flex-col items-center justify-center px-4 py-4 border-b sm:border-b-0 sm:border-r sm:w-1/3">
          {slices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">{t("noResults")}</p>
          ) : (
            <ChartContainer id={pieId} config={pieConfig} className="mx-auto aspect-square w-full max-w-[260px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="label"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={activeIndex}
                  activeShape={activeShape}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-lg font-bold">
                              {activeSlice ? formatCurrency(activeSlice.amount, currency, locale) : ""}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                              {activeSlice?.label ?? ""}
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </div>

        {/* Bar — 2/3 on desktop, stacked by category */}
        <div className="flex-1 px-2 py-4 sm:px-4">
          <ChartContainer config={barConfig} className="aspect-auto h-[280px] w-full">
            <BarChart accessibilityLayer data={barData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString(locale, { month: "short", day: "numeric" })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
                    }
                    formatter={(value, name, item) => {
                      const color = (item?.payload && item.color) || item?.color
                      const label =
                        (barConfig[name as keyof typeof barConfig] as any)?.label ?? name
                      return (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: color as string }}
                          />
                          <div className="flex flex-1 items-center justify-between gap-2">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {formatCurrency(Number(value) || 0, currency, locale)}
                            </span>
                          </div>
                        </>
                      )
                    }}
                  />
                }
              />
              {slices.map((s) => (
                <Bar
                  key={s.colorKey}
                  dataKey={s.colorKey}
                  stackId="a"
                  fill={`var(--color-${s.colorKey})`}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  )
}
