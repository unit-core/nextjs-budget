"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { parseMonthParam, toMonthParam } from "@/app/(app)/dashboard/_lib/date-range"

function getMonthNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i, 1).toLocaleString(locale, { month: "short" }),
  )
}

export function MonthPicker() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()

  const selected = parseMonthParam(searchParams.get("month"))
  const [viewYear, setViewYear] = React.useState(selected.getFullYear())
  const [open, setOpen] = React.useState(false)

  const today = new Date()
  const monthNames = React.useMemo(() => getMonthNames(locale), [locale])

  const isFutureMonth = (year: number, month: number) =>
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth())

  function navigate(date: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", toMonthParam(date))
    router.push(`?${params.toString()}`)
  }

  function prevMonth() {
    navigate(new Date(selected.getFullYear(), selected.getMonth() - 1, 1))
  }

  function nextMonth() {
    const next = new Date(selected.getFullYear(), selected.getMonth() + 1, 1)
    if (!isFutureMonth(next.getFullYear(), next.getMonth())) navigate(next)
  }

  function selectMonth(month: number) {
    navigate(new Date(viewYear, month, 1))
    setOpen(false)
  }

  const label = selected.toLocaleString(locale, { month: "long", year: "numeric" })
  const isNextDisabled = isFutureMonth(selected.getFullYear(), selected.getMonth() + 1)

  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon" className="size-7" onClick={prevMonth}>
        <ChevronLeftIcon className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setViewYear(selected.getFullYear()) }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-7 gap-1 px-2 text-sm font-medium capitalize">
            {label}
            <ChevronDownIcon className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setViewYear((y) => y - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="text-sm font-medium">{viewYear}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={viewYear >= today.getFullYear()}
                onClick={() => setViewYear((y) => y + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {monthNames.map((name, i) => {
                const isSelected =
                  viewYear === selected.getFullYear() && i === selected.getMonth()
                const disabled = isFutureMonth(viewYear, i)
                return (
                  <Button
                    key={i}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn("h-8 capitalize", disabled && "opacity-50")}
                    disabled={disabled}
                    onClick={() => selectMonth(i)}
                  >
                    {name}
                  </Button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={isNextDisabled}
        onClick={nextMonth}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  )
}
