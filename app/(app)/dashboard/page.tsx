import { Suspense } from "react"
import { getTranslations } from "next-intl/server"

import { AllTransactionsDataTable } from "@/components/all-transactions-data-table"
import { type SidebarUser } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { EmptyState } from "@/components/empty-state"
import { MonthTransactionsDataTable } from "@/components/month-transactions-data-table"
import { SectionCards, type DateTexts } from "@/components/section-cards"

import { getLocale } from "@/i18n/actions"
import { createClient } from "@/lib/supabase/server"

import type { Transaction } from "./types"
import {
  aggregateMonth,
  buildChartItems,
  confirmedInRange,
  isConfirmed,
} from "./_lib/aggregate"
import { getMonthRange } from "./_lib/date-range"
import { formatLongDate, formatMonth, formatWeekdayLong } from "./_lib/format"
import {
  buildCategoryRows,
  buildSummary,
  buildTransactionRow,
} from "./_lib/view-models"

const TRANSACTIONS_SELECT = `
  id,
  name,
  status,
  transaction_type,
  executed_at,
  transaction_items (
    id,
    name,
    amount,
    currency_code,
    category,
    executed_at
  )
`

export default async function Page() {
  const locale = await getLocale()
  const sectionCardsTexts = buildDateTexts(new Date(), locale)

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <Suspense fallback={<DashboardSkeleton />}>
          <AsyncDashboardContent texts={sectionCardsTexts} />
        </Suspense>
      </div>
    </div>
  )
}

function buildDateTexts(today: Date, locale: string): DateTexts {
  const { start, end } = getMonthRange(today)
  return {
    today: formatWeekdayLong(today, locale),
    month: formatMonth(today, locale),
    monthRange: `${formatLongDate(start, locale)} - ${formatLongDate(end, locale)}`,
  }
}

async function AsyncDashboardContent({ texts }: { texts: DateTexts }) {
  const supabase = await createClient()
  const locale = await getLocale()
  const td = await getTranslations("Dashboard")
  const tc = await getTranslations("Categories")

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sidebarUser: SidebarUser = user
    ? { id: user.id, email: user.email ?? "-" }
    : null

  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTIONS_SELECT)
    .order("executed_at", { ascending: false })

  if (error || !data) {
    return <div className="p-4 text-destructive">{td("somethingWentWrong")}</div>
  }

  const transactions = data as unknown as Transaction[]
  if (transactions.length === 0) {
    return <EmptyState user={sidebarUser} />
  }

  const today = new Date()
  const monthAggregate = aggregateMonth(
    confirmedInRange(transactions, getMonthRange(today)),
    today,
  )

  const summary = buildSummary(monthAggregate, locale)
  const categoryRows = buildCategoryRows(monthAggregate.categories, locale, tc)
  const chartItems = buildChartItems(transactions)
  const confirmedRows = transactions
    .filter(isConfirmed)
    .map((tx) => buildTransactionRow(tx, locale))
  const pendingRows = transactions
    .filter((tx) => !isConfirmed(tx))
    .map((tx) => buildTransactionRow(tx, locale))

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards texts={texts} values={summary} />
      <MonthTransactionsDataTable
        data={categoryRows}
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
      <AllTransactionsDataTable data={confirmedRows} pendingData={pendingRows} />
    </div>
  )
}
