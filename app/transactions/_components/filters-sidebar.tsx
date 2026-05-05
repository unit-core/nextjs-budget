"use client"

import * as React from "react"
import {
  endOfMonth,
  format,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface FiltersSidebarProps {
  range: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
}

function rangeKey(range: DateRange | undefined): string {
  return `${range?.from?.getTime() ?? ""}|${range?.to?.getTime() ?? ""}`
}

function buildPresets(): { label: string; range: DateRange }[] {
  const today = new Date()
  return [
    { label: "Today", range: { from: today, to: today } },
    {
      label: "Yesterday",
      range: { from: subDays(today, 1), to: subDays(today, 1) },
    },
    { label: "Last 7 days", range: { from: subDays(today, 6), to: today } },
    { label: "Last 30 days", range: { from: subDays(today, 29), to: today } },
    {
      label: "This month",
      range: { from: startOfMonth(today), to: today },
    },
    {
      label: "Last month",
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
  ]
}

export function FiltersSidebar({ range, onRangeChange }: FiltersSidebarProps) {
  const [draft, setDraft] = React.useState<DateRange | undefined>(range)

  React.useEffect(() => {
    setDraft(range)
  }, [range])

  const dirty = rangeKey(draft) !== rangeKey(range)

  return (
    <Sidebar
      variant="floating"
      collapsible="offcanvas"
      className="[&_[data-sidebar=sidebar]]:backdrop-blur [&_[data-sidebar=sidebar]]:supports-[backdrop-filter]:bg-background/80"
    >
      <SidebarHeader>
        <div className="px-2 py-1 text-base font-semibold">Filters</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Date</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !draft?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {draft?.from ? (
                    draft.to ? (
                      <>
                        {format(draft.from, "LLL dd, y")} – {format(draft.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(draft.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="flex w-40 flex-col gap-1 border-r p-2">
                    {buildPresets().map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="justify-start font-normal"
                        onClick={() => setDraft(preset.range)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Calendar
                    mode="range"
                    defaultMonth={draft?.from}
                    selected={draft}
                    onSelect={setDraft}
                    numberOfMonths={2}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          className="w-full"
          disabled={!dirty}
          onClick={() => onRangeChange(draft)}
        >
          Apply
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
