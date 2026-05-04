"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface CategoryPieProps {
  data: { category: string; amount: number; fill: string }[]
  total: number
  currency: string
  config: ChartConfig
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()
function formatAmount(amount: number, currency: string) {
  let f = currencyFormatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency })
    currencyFormatters.set(currency, f)
  }
  return f.format(amount)
}

export function CategoryPie({ data, total, currency, config }: CategoryPieProps) {
  return (
    <ChartContainer
      config={config}
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
                  <span>{config[name as string]?.label ?? name}</span>
                  <span className="font-mono font-medium">
                    {formatAmount(Number(value), currency)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          innerRadius={60}
          strokeWidth={2}
        >
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
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
                    className="fill-foreground text-base font-bold"
                  >
                    {formatAmount(total, currency)}
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    y={(viewBox.cy ?? 0) + 18}
                    className="fill-muted-foreground text-xs"
                  >
                    Total
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
