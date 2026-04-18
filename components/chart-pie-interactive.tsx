"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export function ChartPieInteractive({ categories }: Props) {
  const locale = useLocale()
  const t = useTranslations("Dashboard")
  const tg = useTranslations("CategoryGroups")

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
  const resolvedCurrency = currencies.includes(activeCurrency) ? activeCurrency : (currencies[0] ?? "")

  const slices = React.useMemo(() => {
    return categories
      .filter((cat) => (cat.totals[resolvedCurrency] ?? 0) > 0)
      .map((cat, i) => {
        const key = cat.group?.name
        const nameKey = key ? (`${key}.name` as Parameters<typeof tg>[0]) : null
        const label = nameKey && tg.has(nameKey) ? tg(nameKey) : (key ?? t("noResults"))
        const colorKey = `cat_${i}`
        return {
          colorKey,
          label,
          amount: cat.totals[resolvedCurrency],
          fill: `var(--color-${colorKey})`,
        }
      })
  }, [categories, resolvedCurrency, tg, t])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    slices.forEach((s, i) => {
      config[s.colorKey] = { label: s.label, color: CHART_COLORS[i % CHART_COLORS.length] }
    })
    return config
  }, [slices])

  const [activeColorKey, setActiveColorKey] = React.useState<string>("")
  const resolvedKey = slices.find((s) => s.colorKey === activeColorKey)?.colorKey ?? slices[0]?.colorKey ?? ""
  const activeIndex = slices.findIndex((s) => s.colorKey === resolvedKey)
  const activeSlice = slices[activeIndex]

  const id = `pie-${resolvedCurrency}`

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
    <Card className="py-0 w-full flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>{t("spendingByCategory")}</CardTitle>
          <CardDescription>{t("monthlyBreakdown")}</CardDescription>
        </div>
        <div className="flex">
          {currencies.map((c) => (
            <button
              key={c}
              data-active={resolvedCurrency === c}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveCurrency(c)}
            >
              <span className="text-xs text-muted-foreground">{c}</span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {new Intl.NumberFormat(locale, {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(currencyTotals[c] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center py-4">
        {slices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noResults")}</p>
        ) : (
          <>
            <div className="flex w-full justify-end mb-2">
              <Select value={resolvedKey} onValueChange={setActiveColorKey}>
                <SelectTrigger className="h-7 w-[160px] rounded-lg pl-2.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="rounded-xl">
                  {slices.map((s) => (
                    <SelectItem key={s.colorKey} value={s.colorKey} className="rounded-lg [&_span]:flex">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="flex h-3 w-3 shrink-0 rounded-xs"
                          style={{ backgroundColor: `var(--color-${s.colorKey})` }}
                        />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ChartContainer
              id={id}
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[280px]"
            >
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
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                              {activeSlice ? formatCurrency(activeSlice.amount, resolvedCurrency, locale) : ""}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground text-xs">
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
