import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AllTransactionsDataTable, schema } from "@/components/all-transactions-data-table"
import { SectionCards, DateTexts } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { EmptyState } from "@/components/empty-state"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { SidebarUser } from "@/components/app-sidebar"
import { MonthTransactionsDataTable } from "@/components/month-transactions-data-table"
import { getDirection } from "@/i18n/actions"
import { getTranslations } from "next-intl/server"

interface MonthRange {
  start: Date;
  end: Date;
}

function getMonthRange(date: Date): MonthRange {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function formatCurrencyDict(totals: Record<string, number>) {
  const keys = Object.keys(totals);
  if (keys.length === 0) return "0,00";
  return keys.map(currency => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    }).format(totals[currency]);
  }).join('\n');
}

async function AsyncDashboardContent({ texts }: { texts: DateTexts }) {
  const currentDate = new Date()
  const { start, end } = getMonthRange(currentDate)
  const supabase = await createClient()
  const td = await getTranslations("Dashboard")
  const tc = await getTranslations("Categories")

  const { data: { user } } = await supabase.auth.getUser()
  const sidebarUser: SidebarUser = user
    ? { id: user.id, email: user.email ?? '-' }
    : null

  // Single request: fetch ALL transactions with items
  const { data: allTransactions, error } = await supabase.from('transactions')
    .select(`
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
    `)
    .order('executed_at', { ascending: false })

  if (error || !allTransactions) {
    return <div className="p-4 text-destructive">Something went wrong loading transactions.</div>
  }

  // Empty state: no transactions at all
  if (allTransactions.length === 0) {
    return <EmptyState user={sidebarUser} />
  }

  // --- Derive all data from the single response ---

  // 1. Section cards + month categories (confirmed, current month only)
  const confirmedThisMonth = allTransactions.filter(t =>
    t.status === 'CONFIRMED' &&
    new Date(t.executed_at) >= start &&
    new Date(t.executed_at) <= end
  )

  const todayDateString = currentDate.toDateString();
  const monthTotals: Record<string, number> = {};
  const todayTotals: Record<string, number> = {};
  const categoryMap: Record<string, Record<string, number>> = {};
  const categoryTxTotals: Record<string, Record<string, Record<string, number>>> = {};
  const categoryTxMeta: Record<string, Record<string, { name: string; executed_at: string }>> = {};
  let itemsCount = 0;

  confirmedThisMonth.forEach((transaction) => {
    const isToday = new Date(transaction.executed_at).toDateString() === todayDateString;
    const items = transaction.transaction_items || [];
    itemsCount += items.length;

    items.forEach((item) => {
      const currency = item.currency_code || 'EUR';
      const amount = item.amount || 0;
      const category = item.category || 'Other';

      monthTotals[currency] = (monthTotals[currency] || 0) + amount;
      if (isToday) {
        todayTotals[currency] = (todayTotals[currency] || 0) + amount;
      }

      if (!categoryMap[category]) categoryMap[category] = {};
      categoryMap[category][currency] = (categoryMap[category][currency] || 0) + amount;

      if (!categoryTxTotals[category]) {
        categoryTxTotals[category] = {};
        categoryTxMeta[category] = {};
      }
      if (!categoryTxTotals[category][transaction.id]) {
        categoryTxTotals[category][transaction.id] = {};
        categoryTxMeta[category][transaction.id] = {
          name: transaction.name || '-',
          executed_at: new Date(transaction.executed_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
        };
      }
      categoryTxTotals[category][transaction.id][currency] =
        (categoryTxTotals[category][transaction.id][currency] || 0) + amount;
    });
  });

  const categoriesData = Object.entries(categoryMap).map(([categoryName, currencies]) => {
    const txs = categoryTxTotals[categoryName] || {};
    const meta = categoryTxMeta[categoryName] || {};
    return {
      name: tc.has(`${categoryName}.name`) ? tc(`${categoryName}.name`) : categoryName,
      description: tc.has(`${categoryName}.description`) ? tc(`${categoryName}.description`) : undefined,
      amount: formatCurrencyDict(currencies),
      transactions: Object.entries(txs).map(([txId, totals]) => ({
        name: meta[txId]?.name || '-',
        amount: formatCurrencyDict(totals),
      })),
    };
  });

  const summary = {
    today: formatCurrencyDict(todayTotals),
    month: formatCurrencyDict(monthTotals),
    transactions_number: confirmedThisMonth.length,
    items_number: itemsCount
  };

  // 2. Chart data (all confirmed transactions)
  const chartItems = allTransactions
    .filter(t => t.status === 'CONFIRMED')
    .flatMap(t => t.transaction_items)

  // 3. All transactions table data
  const mapTransaction = (element: typeof allTransactions[number]): z.infer<typeof schema> => {
    const executedAt = new Date(element.executed_at)
    const executedAtString = executedAt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const totalsByCurrency = element.transaction_items.reduce((acc: Record<string, number>, item) => {
      const currency = item.currency_code || 'EUR';
      acc[currency] = (acc[currency] || 0) + (item.amount || 0);
      return acc;
    }, {});
    const totalAmountString = Object.keys(totalsByCurrency).length === 0
      ? "—"
      : Object.entries(totalsByCurrency)
          .map(([currency, amount]) => {
            return new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: currency
            }).format(amount);
          })
          .join('\n');
    return {
      id: element.id,
      name: element.name.length > 0 ? element.name : '-',
      status: element.status,
      transaction_type: element.transaction_type,
      executed_at: executedAtString,
      amount: totalAmountString
    }
  }

  const pendingData = allTransactions
    .filter(t => t.status !== 'CONFIRMED')
    .map(mapTransaction)
  const completedData = allTransactions
    .filter(t => t.status === 'CONFIRMED')
    .map(mapTransaction)

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards texts={texts} values={summary} />
      <MonthTransactionsDataTable
        data={categoriesData}
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
      <AllTransactionsDataTable data={completedData} pendingData={pendingData} />
    </div>
  )
}

async function AsyncAppSidebar() {
  const supabase = await createClient()
  const direction = await getDirection()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const sidebarUser: SidebarUser = {
    id: user.id,
    email: user.email ?? '-'
  }
  return <AppSidebar variant="inset" user={sidebarUser} direction={direction} />
}

export default function Page() {
  const currentDate = new Date()
  const { start, end } = getMonthRange(currentDate);
  const sectionCardsTexts: DateTexts = {
    today: currentDate.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    month: currentDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long"
    }),
    monthRange: `${start.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} - ${end.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Suspense fallback={<AppSidebar variant="inset" user={null} />}>
        <AsyncAppSidebar/>
      </Suspense>

      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Suspense fallback={<DashboardSkeleton />}>
              <AsyncDashboardContent texts={sectionCardsTexts} />
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
