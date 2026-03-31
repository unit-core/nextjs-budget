import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { AllTransactionsDataTable, AllTransactionsDataTableSkeleton, schema } from "@/components/all-transactions-data-table"
import { SectionCards, SectionCardsSkeleton, DateTexts } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import data from "./data.json"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { SidebarUser } from "@/components/app-sidebar"
import { MonthTransactionsDataTable, MonthTransactionsDataTableSkeleton } from "@/components/month-transactions-data-table"
import { getDirection } from "@/i18n/actions"

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
    
  if (transactions) {
    const todayDateString = new Date().toDateString();

    const monthTotals: Record<string, number> = {};
    const todayTotals: Record<string, number> = {};
    
    // Структура: { "Food": { "EUR": 100, "USD": 50 }, "Transport": { "EUR": 20 } }
    const categoryMap: Record<string, Record<string, number>> = {}; 
    let itemsCount = 0;

    transactions.forEach((transaction) => {
      const isToday = new Date(transaction.executed_at).toDateString() === todayDateString;
      const items = transaction.transaction_items || [];
      itemsCount += items.length;

      items.forEach((item) => {
        const currency = item.currency_code || 'EUR';
        const amount = item.amount || 0;
        const category = item.category || 'Other';

        // Итоги для карточек (верхний уровень)
        monthTotals[currency] = (monthTotals[currency] || 0) + amount;
        if (isToday) {
          todayTotals[currency] = (todayTotals[currency] || 0) + amount;
        }

        // Группировка для таблицы по категориям и валютам
        if (!categoryMap[category]) {
          categoryMap[category] = {};
        }
        categoryMap[category][currency] = (categoryMap[category][currency] || 0) + amount;
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
    const categoriesData = Object.entries(categoryMap).map(([categoryName, currencies]) => ({
      name: categoryName,
      amount: formatCurrencyDict(currencies) // Здесь будет строка с переносами, если валют несколько
    }));

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
        <MonthTransactionsDataTable data={categoriesData} />
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
    const transactionsArray: z.infer<typeof schema>[] = transactions.map((element) => {
      const executedAt = new Date(element.executed_at)
      const executedAtString = executedAt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      // 2. Считаем сумму по каждой валюте
      // Получаем объект вида: { 'EUR': 120, 'USD': 50 }
      const totalsByCurrency = element.transaction_items.reduce((acc: Record<string, number>, item) => {
        // Если currency_code почему-то пустой, задаем фолбэк (например 'EUR')
        const currency = item.currency_code || 'EUR';
        acc[currency] = (acc[currency] || 0) + (item.amount || 0);
          return acc;
      }, {});
      // 3. Превращаем объект с суммами в отформатированную строку
      // Если массив пустой, выводим прочерк или "0"
      const totalAmountString = Object.keys(totalsByCurrency).length === 0 
        ? "—" 
        : Object.entries(totalsByCurrency)
            .map(([currency, amount]) => {
              // Используем Intl.NumberFormat для красивого отображения (со значками валют и пробелами)
              return new Intl.NumberFormat(undefined, { 
                style: 'currency', 
                currency: currency 
              }).format(amount);
            })
            .join('\n'); // Если валют несколько, соединяем их плюсом (или запятой: ', ')
      return {
        id: element.id,
        name: element.name.length > 0 ? element.name : '-',
        status: element.status,
        transaction_type: element.transaction_type,
        executed_at: executedAtString,
        amount: totalAmountString
      }
    })
    return (
      <AllTransactionsDataTable data={transactionsArray} />
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
  if (!user) throw { message: "User undefined for app sidebar"}
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
                <ChartAreaInteractive />
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
