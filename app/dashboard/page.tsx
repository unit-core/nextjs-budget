import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AllTransactionsDataTable, AllTransactionsDataTableSkeleton, schema } from "@/components/all-transactions-data-table"
import { SectionCards, SectionCardsSkeleton, DateTexts } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import data from "./data.json"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { SidebarUser } from "@/components/app-sidebar"
import { MonthTransactionsDataTable, MonthTransactionsDataTableSkeleton } from "@/components/month-transactions-data-table"
import { getDirection } from "@/i18n/actions"
import { getTranslations } from "next-intl/server"

// Вспомогательная функция (эквивалент Task.sleep)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MonthRange {
  start: Date;
  end: Date;
}

function getMonthRange(date: Date): MonthRange {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 1st day of the current month at 00:00:00.000
  const start = new Date(year, month, 1);

  // Last day of the current month at 23:59:59.999
  // (Using month + 1 and day 0 rolls back to the last day of 'month')
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

async function AsyncSectionCards({texts}: { texts: DateTexts }) {
  const currentDate = new Date()
  const { start, end } = getMonthRange(currentDate)
  const supabase = await createClient()
  const td = await getTranslations("Dashboard")
  
  const { data: transactions, error } = await supabase.from('transactions')
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
        category
      )
    `)
    .order('executed_at', { ascending: false })
    .gte('executed_at', start.toISOString())
    .lt('executed_at', end.toISOString())
    .eq('status', 'CONFIRMED')

  if (transactions) {
    const todayDateString = new Date().toDateString();

    const monthTotals: Record<string, number> = {};
    const todayTotals: Record<string, number> = {};
    
    const categoryMap: Record<string, Record<string, number>> = {};
    // Track transactions per category: key is "category::transactionId"
    const categoryTxTotals: Record<string, Record<string, Record<string, number>>> = {};
    const categoryTxMeta: Record<string, Record<string, { name: string; executed_at: string }>> = {};
    let itemsCount = 0;

    transactions.forEach((transaction) => {
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

        if (!categoryMap[category]) {
          categoryMap[category] = {};
        }
        categoryMap[category][currency] = (categoryMap[category][currency] || 0) + amount;

        // Group by transaction within each category
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

    // Хелпер для форматирования (тот же, что вы использовали для карточек)
    const formatCurrencyDict = (totals: Record<string, number>) => {
      const keys = Object.keys(totals);
      if (keys.length === 0) return "0,00";
      return keys.map(currency => {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currency
        }).format(totals[currency]);
      }).join('\n'); // Склеиваем переносом строки
    };

    // Формируем финальный массив для MonthTransactionsDataTable
    const tc = await getTranslations("Categories")
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
      transactions_number: transactions.length,
      items_number: itemsCount
    };

    return (
      <div className="flex flex-col gap-4">
        <SectionCards texts={texts} values={summary}/>
        {/* Теперь data содержит массив объектов { name, amount } */}
        <MonthTransactionsDataTable data={categoriesData} translations={{ category: td("category"), amount: td("amount"), noResults: td("noResults"), loading: td("loading") }} />
      </div>
    )
  } else {
    return (
      <div className="p-4 text-red-500">Something went wrong or no data found</div>
    )
  }
}

async function AsyncDataTable() {
  const supabase = await createClient()
  const { data: transactions, error } = await supabase.from('transactions')
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
        category
      )
    `)
    .order('executed_at', { ascending: false })
  if (transactions) {
    const mapTransaction = (element: typeof transactions[number]): z.infer<typeof schema> => {
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

    const pendingData = transactions
      .filter(t => t.status !== 'CONFIRMED')
      .map(mapTransaction)
    const completedData = transactions
      .filter(t => t.status === 'CONFIRMED')
      .map(mapTransaction)

    return (
      <AllTransactionsDataTable data={completedData} pendingData={pendingData} />
    )
  } else {
    return (
      <div>Some thing went wrong</div>
    )
  }
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

async function AsyncChartAreaInteractive() {
  const supabase = await createClient()
  const { data: transactions, error } = await supabase.from('transactions')
    .select(`
      transaction_items (
        executed_at,
        currency_code,
        amount
      )
    `)
    .eq('status', 'CONFIRMED')
    .order('executed_at', { ascending: false })
  if (!transactions) return <div>Empty</div>
  const items = transactions.flatMap((t) => t.transaction_items)
  return <ChartAreaInteractive items={items}/>
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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              <Suspense fallback={
                <div className="flex flex-col gap-4">
                  <SectionCardsSkeleton texts={sectionCardsTexts}/>
                  <MonthTransactionsDataTableSkeleton />
                </div>
              }>
                <AsyncSectionCards texts={sectionCardsTexts}/>
              </Suspense>
              
              <div className="px-4 lg:px-6">
                <Suspense fallback={<div>Loading charts</div>}>
                  <AsyncChartAreaInteractive/>
                </Suspense>
              </div>
              <Suspense fallback={<AllTransactionsDataTableSkeleton />}>
                <AsyncDataTable/>
              </Suspense>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
