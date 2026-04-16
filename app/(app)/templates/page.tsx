import { Suspense } from "react"
import { getTranslations } from "next-intl/server"

import { TemplatesDataTable } from "@/components/templates-data-table"
import { getLocale } from "@/i18n/actions"
import { createClient } from "@/lib/supabase/server"

import { formatLongDate } from "../dashboard/_lib/format"
import type { TransactionTemplate } from "../dashboard/types"

const TEMPLATES_SELECT = `
  id,
  name,
  transaction_type,
  created_at,
  folder_id,
  transaction_item_templates (
    amount,
    currency_code
  )
`

export default async function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <Suspense fallback={<TemplatesSkeleton />}>
          <AsyncTemplatesContent />
        </Suspense>
      </div>
    </div>
  )
}

function TemplatesSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="px-4 lg:px-6">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}

async function AsyncTemplatesContent() {
  const supabase = await createClient()
  const locale = await getLocale()
  const tt = await getTranslations("Templates")

  const { data, error } = await supabase
    .from("transaction_templates")
    .select(TEMPLATES_SELECT)
    .order("created_at", { ascending: false })

  if (error || !data) {
    return (
      <div className="p-4 text-destructive">{tt("somethingWentWrong")}</div>
    )
  }

  const templates = data as unknown as TransactionTemplate[]

  const rows = templates.map((tmpl) => ({
    id: tmpl.id,
    name: tmpl.name,
    transaction_type: tmpl.transaction_type,
    created_at: formatLongDate(new Date(tmpl.created_at), locale),
    amount: formatTemplateTotals(tmpl.transaction_item_templates, locale),
    folder_id: tmpl.folder_id,
  }))

  return <TemplatesDataTable data={rows} />
}

function formatTemplateTotals(
  items: { amount: number; currency_code: string }[],
  locale: string,
): string {
  if (items.length === 0) return "—"
  const byCurrency = new Map<string, number>()
  for (const item of items) {
    byCurrency.set(
      item.currency_code,
      (byCurrency.get(item.currency_code) ?? 0) + item.amount,
    )
  }
  return [...byCurrency.entries()]
    .map(([currency, total]) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(total)
      } catch {
        return `${total} ${currency}`
      }
    })
    .join("\n")
}
