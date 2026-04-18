"use client"

import { useTranslations } from "next-intl"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "./ui/skeleton"

export interface DateTexts {
  today: string;
  month: string;
  monthRange: string;
}

export interface DateValues {
  today: string;
  month: string;
  transactions_number: number;
  items_number: number;
}

interface SectionCardsProps {
  texts: DateTexts
  values: DateValues
  isCurrentMonth: boolean
}

function gridClass(isCurrentMonth: boolean) {
  return isCurrentMonth
    ? "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card"
    : "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card"
}

export function SectionCards({ texts, values, isCurrentMonth }: SectionCardsProps) {
  const t = useTranslations("Dashboard")
  return (
    <div className={gridClass(isCurrentMonth)}>
      {isCurrentMonth && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("today")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl whitespace-pre-line">
              {values.today}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {t("totalAmountToday")}
            </div>
            <div className="text-muted-foreground">
              {texts.today}
            </div>
          </CardFooter>
        </Card>
      )}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="capitalize">{texts.month}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl whitespace-pre-line">
            {values.month}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("totalAmountMonth", { month: texts.month })}
          </div>
          <div className="text-muted-foreground">
            {texts.monthRange}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("transactions")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {values.transactions_number}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("numberOfTransactions", { month: texts.month })}
          </div>
          <div className="text-muted-foreground">
            {texts.monthRange}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("items")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {values.items_number}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("numberOfPositions")}
          </div>
          <div className="text-muted-foreground">{t("inTransactionsFor", { month: texts.month })}</div>
        </CardFooter>
      </Card>
    </div>
  )
}

export function SectionCardsSkeleton({ texts, isCurrentMonth = true }: { texts: DateTexts; isCurrentMonth?: boolean }) {
  const t = useTranslations("Dashboard")
  return (
    <div className={gridClass(isCurrentMonth)}>
      {isCurrentMonth && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{t("today")}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <Skeleton className="h-9 w-[120px]" />
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {t("totalAmountToday")}
            </div>
            <div className="text-muted-foreground">
              {texts.today}
            </div>
          </CardFooter>
        </Card>
      )}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="capitalize">{texts.month}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Skeleton className="h-9 w-[180px]" />
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("totalAmountMonth", { month: texts.month })}
          </div>
          <div className="text-muted-foreground">
            {texts.monthRange}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("transactions")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Skeleton className="h-9 w-[60px]" />
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("numberOfTransactions", { month: texts.month })}
          </div>
          <div className="text-muted-foreground">
            {texts.monthRange}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t("items")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Skeleton className="h-9 w-[90px]" />
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t("numberOfPositions")}
          </div>
          <div className="text-muted-foreground">{t("inTransactionsFor", { month: texts.month })}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
