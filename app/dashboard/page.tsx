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
    // 1. Определяем "сегодняшнюю" дату для сравнения
    const todayDateString = new Date().toDateString();

    // 2. Подготавливаем хранилища для подсчетов
    const monthTotals: Record<string, number> = {};
    const todayTotals: Record<string, number> = {};
    let itemsCount = 0;

    // 3. Проходим по всем транзакциям один раз
    transactions.forEach((transaction) => {
      // Проверяем, совершена ли транзакция сегодня
      const isToday = new Date(transaction.executed_at).toDateString() === todayDateString;
      
      const items = transaction.transaction_items || [];
      itemsCount += items.length; // Плюсуем количество айтемов

      // Проходим по всем позициям внутри транзакции
      items.forEach((item) => {
        const currency = item.currency_code || 'EUR'; // Фоллбэк, если кода нет
        const amount = item.amount || 0;

        // Прибавляем к итогам за месяц
        monthTotals[currency] = (monthTotals[currency] || 0) + amount;

        // Если транзакция сегодняшняя, прибавляем к итогам за сегодня
        if (isToday) {
          todayTotals[currency] = (todayTotals[currency] || 0) + amount;
        }
      });
    });

    // 4. Вспомогательная функция для форматирования сумм
    const formatTotals = (totals: Record<string, number>) => {
      const keys = Object.keys(totals);
      if (keys.length === 0) return "0,00"; // Если данных нет
      
      return keys.map(currency => {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: currency
        }).format(totals[currency]);
      }).join('\n'); // Соединяем переносом строки
    };

    // 5. Собираем итоговый объект
    const summary = {
      today: formatTotals(todayTotals),
      month: formatTotals(monthTotals),
      transactions_number: transactions.length,
      items_number: itemsCount
    };
    return (
      <div className="flex flex-col gap-4">
        <SectionCards texts={texts} values={summary}/>
        <MonthTransactionsDataTable data={[]} />
      </div>
    )
  } else {
    return (
      <div>Some thing went wrong</div>
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
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  // console.log(user)
  if (!user) throw { message: "User undefined for app sidebar"}
  const sidebarUser: SidebarUser = {
    id: user.id
  }
  return <AppSidebar variant="inset" user={sidebarUser} />
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
