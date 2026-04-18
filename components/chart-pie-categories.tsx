"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { useLocale, useTranslations } from "next-intl"

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
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CategoryAggregate } from "@/app/(app)/dashboard/_lib/aggregate"
import { formatCurrency } from "@/app/(app)/dashboard/_lib/format"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface Props {
  categories: CategoryAggregate[]
}

export function ChartPieCategories({ categories }: Props) {
  const locale = useLocale()
  const t = useTranslations("Dashboard")

  const currencies = React.useMemo(() => {
    const set = new Set<string>()
    for (const cat of categories) {
      for (const code of Object.keys(cat.totals)) {
        set.add(code)
      }
    }
    return Array.from(set)
  }, [categories])

  if (currencies.length === 0) return null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("spendingByCategory")}</CardTitle>
        <CardDescription>{t("monthlyBreakdown")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={currencies[0]}>
          <TabsList className="mb-4">
            {currencies.map((currency) => (
              <TabsTrigger key={currency} value={currency}>
                {currency}
              </TabsTrigger>
            ))}
          </TabsList>
          {currencies.map((currency) => (
            <CurrencyPieTab
              key={currency}
              currency={currency}
              categories={categories}
              locale={locale}
              noDataLabel={t("noResults")}
            />
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function PieTooltip({
  active,
  payload,
  currency,
  locale,
}: {
  active?: boolean
  payload?: any[]
  currency: string
  locale: string
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-background border border-border rounded-md px-3 py-2 shadow-md text-sm flex items-center gap-2">
      <div
        className="w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ background: item.payload.fill }}
      />
      <span className="text-muted-foreground">{item.name}</span>
      <span className="font-semibold">
        {formatCurrency(item.value, currency, locale)}
      </span>
    </div>
  )
}

function CurrencyPieTab({
  currency,
  categories,
  locale,
  noDataLabel,
}: {
  currency: string
  categories: CategoryAggregate[]
  locale: string
  noDataLabel: string
}) {
  const tg = useTranslations("CategoryGroups")

  const slices = React.useMemo(() => {
    return categories
      .filter((cat) => (cat.totals[currency] ?? 0) > 0)
      .map((cat, i) => {
        const key = cat.group?.name
        const nameKey = key ? (`${key}.name` as Parameters<typeof tg>[0]) : null
        const localizedName = nameKey && tg.has(nameKey) ? tg(nameKey) : (key ?? noDataLabel)
        return {
          name: localizedName,
          amount: cat.totals[currency],
          fill: CHART_COLORS[i % CHART_COLORS.length],
        }
      })
  }, [categories, currency, tg, noDataLabel])

  const total = React.useMemo(
    () => slices.reduce((acc, s) => acc + s.amount, 0),
    [slices],
  )

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = { amount: { label: "Amount" } }
    slices.forEach((s, i) => {
      config[s.name] = {
        label: s.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }
    })
    return config
  }, [slices])

  if (slices.length === 0) {
    return (
      <TabsContent value={currency}>
        <p className="text-muted-foreground text-sm text-center py-8">{noDataLabel}</p>
      </TabsContent>
    )
  }

  return (
    <TabsContent value={currency}>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[300px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<PieTooltip currency={currency} locale={locale} />}
          />
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="name"
            innerRadius={70}
            strokeWidth={4}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {formatCurrency(total, currency, locale)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground text-xs"
                      >
                        {currency}
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </TabsContent>
  )
}
