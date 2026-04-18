"use client"

import { Suspense } from "react"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"

import { MonthPicker } from "@/components/month-picker"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const t = useTranslations("Dashboard")
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard" || pathname.endsWith("/dashboard")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {isDashboard ? (
          <Suspense fallback={<span className="text-sm font-medium">{t("transactions")}</span>}>
            <MonthPicker />
          </Suspense>
        ) : (
          <h1 className="text-base font-medium">{t("transactions")}</h1>
        )}
      </div>
    </header>
  )
}
