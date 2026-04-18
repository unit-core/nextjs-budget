import { Suspense } from "react"
import { getTranslations } from "next-intl/server"

import { AllTransactionsDataTable } from "@/components/all-transactions-data-table"
import { type SidebarUser } from "@/components/app-sidebar"
import { ChartCombined } from "@/components/chart-combined"
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
    executed_at,
    transaction_item_categories!transaction_item_category_id (
      id,
      name,
      description,
      owner_id,
      category_group:transaction_item_category_groups!transaction_item_category_group_id (
        id,
        name,
        description,
        owner_id,
        type
      )
    )
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
  const tg = await getTranslations("CategoryGroups")

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
  const categoryRows = buildCategoryRows(monthAggregate.categories, locale, (key) => {
    const nameKey = `${key}.name` as Parameters<typeof tg>[0]
    const descKey = `${key}.description` as Parameters<typeof tg>[0]
    if (!tg.has(nameKey)) return undefined
    return {
      name: tg(nameKey),
      description: tg.has(descKey) ? tg(descKey) : undefined,
    }
  })
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
      <div className="px-4 lg:px-6">
        <ChartCombined categories={monthAggregate.categories} items={chartItems} />
      </div>
      {/* <MonthTransactionsDataTable
        data={categoryRows}
        translations={{
          category: td("category"),
          amount: td("amount"),
          noResults: td("noResults"),
          loading: td("loading"),
        }}
      /> */}
      <AllTransactionsDataTable data={confirmedRows} pendingData={pendingRows} />
    </div>
  )
}
