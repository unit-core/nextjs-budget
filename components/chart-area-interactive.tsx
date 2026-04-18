"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useTranslations, useLocale } from "next-intl"

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
}

export function ChartAreaInteractive({ items }: { items: DataItem[] }) {
  const t = useTranslations("Dashboard")
  const locale = useLocale()

  const { chartData, currencyKeys, totals } = React.useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const dailyMap = new Map<string, Record<string, any>>()
    const currencies = new Set<string>()
    const sums: Record<string, number> = {}

    items.forEach((item) => {
      const date = new Date(item.executed_at)
      if (date < monthStart || date > monthEnd) return

      const dateKey = date.toISOString().split("T")[0]
      const code = item.currency_code || "Unknown"
      const val = Number(item.amount) || 0

      currencies.add(code)
      sums[code] = (sums[code] || 0) + val

      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { date: dateKey })
      const node = dailyMap.get(dateKey)!
      node[code] = (node[code] || 0) + val
    })

    const allDates: Record<string, any>[] = []
    const cursor = new Date(monthStart)
    while (cursor <= monthEnd) {
      const dateKey = cursor.toISOString().split("T")[0]
      allDates.push(dailyMap.get(dateKey) ?? { date: dateKey })
      cursor.setDate(cursor.getDate() + 1)
    }

    return {
      chartData: allDates,
      currencyKeys: Array.from(currencies),
      totals: sums,
    }
  }, [items])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = { views: { label: t("amount") } }
    currencyKeys.forEach((key, i) => {
      config[key] = { label: key, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return config
  }, [currencyKeys, t])

  const [activeCurrency, setActiveCurrency] = React.useState<string>("")
  const resolvedCurrency = activeCurrency || currencyKeys[0] || ""

  React.useEffect(() => {
    if (currencyKeys.length > 0 && !currencyKeys.includes(activeCurrency)) {
      setActiveCurrency(currencyKeys[0])
    }
  }, [currencyKeys, activeCurrency])

  if (currencyKeys.length === 0) return null

  return (
    <Card className="py-0 w-full">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>{t("activityByCurrency")}</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </CardDescription>
        </div>
        <div className="flex">
          {currencyKeys.map((key, i) => (
            <button
              key={key}
              data-active={resolvedCurrency === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveCurrency(key)}
            >
              <span className="text-xs text-muted-foreground">{key}</span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {new Intl.NumberFormat(locale, {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(totals[key] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
              }
            />
            <Bar
              dataKey={resolvedCurrency}
              fill={`var(--color-${resolvedCurrency})`}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
