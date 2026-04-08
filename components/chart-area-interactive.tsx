"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface DataItem {
  executed_at: string
  currency_code: string
  amount: number | string
}

export function ChartAreaInteractive({ items }: { items: DataItem[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  // --- 1. Агрегация данных и извлечение валют ---
  const { processedData, currencyKeys } = React.useMemo(() => {
    const dailyMap = new Map<string, Record<string, any>>()
    const currencies = new Set<string>()

    items.forEach((item) => {
      const dateKey = new Date(item.executed_at).toISOString().split("T")[0]
      const code = item.currency_code || "Unknown"
      const val = Number(item.amount) || 0

      currencies.add(code)

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { date: dateKey })
      }
      
      const node = dailyMap.get(dateKey)!
      node[code] = (node[code] || 0) + val
    })

    const sortedData = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return {
      processedData: sortedData,
      currencyKeys: Array.from(currencies)
    }
  }, [items])

  // --- 2. Динамическая генерация chartConfig ---
  const chartConfig = React.useMemo(() => {
    const config = {
      container: { label: "Currencies" }
    } as ChartConfig

    currencyKeys.forEach((key, index) => {
      config[key] = {
        label: key.toUpperCase(),
        // Используем стандартные переменные темы shadcn (--chart-1, --chart-2 и т.д.)
        color: `var(--primary)`,
      }
    })
    return config
  }, [currencyKeys])

  // --- 3. Фильтрация данных по выбранному периоду ---
  const filteredData = React.useMemo(() => {
    const now = new Date()
    const referenceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const days = parseInt(timeRange)
    
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - days)

    return processedData.filter((d) => new Date(d.date) >= startDate)
  }, [processedData, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Activity by Currency</CardTitle>
        <CardDescription>
          Showing total volume for {currencyKeys.join(", ")}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 Months</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 Days</ToggleGroupItem>
          </ToggleGroup>
          {/* Mobile Select можно добавить по аналогии */}
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              {currencyKeys.map((key) => (
                <linearGradient key={key} id={`fill_${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            {currencyKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill={`url(#fill_${key})`}
                stroke={chartConfig[key].color}
                // stackId="currencies" // Уберите stackId, если графики должны перекрывать друг друга, а не суммироваться
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}