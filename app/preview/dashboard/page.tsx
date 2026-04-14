import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"

import { AppSidebar, type SidebarUser } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { MonthTransactionsDataTable } from "@/components/month-transactions-data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getDirection } from "@/i18n/actions"
import { getMockDashboardData } from "@/lib/dashboard-mock-data"

// Skip prerender — gated by env at request time.
export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function PreviewDashboardPage() {
  // Hard gate: only available when the env flag is on (local/CI screenshot builds).
  if (process.env.ENABLE_PREVIEW_ROUTES !== "1") notFound()

  const locale = await getLocale()
  const direction = await getDirection()
  const td = await getTranslations("Dashboard")
  const tc = await getTranslations("Categories")

  const { texts, values, categories, chartItems } = getMockDashboardData(
    locale,
    (k) => (tc.has(`${k}.name`) ? tc(`${k}.name`) : k),
    (k) => (tc.has(`${k}.description`) ? tc(`${k}.description`) : undefined),
  )

  const previewUser: SidebarUser = { id: "preview", email: "demo@unitcore.io" }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={previewUser} direction={direction} hasTransactions />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards texts={texts} values={values} />
              <MonthTransactionsDataTable
                data={categories}
                translations={{
                  category: td("category"),
                  amount: td("amount"),
                  noResults: td("noResults"),
                  loading: td("loading"),
                }}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive items={chartItems} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
