export interface TransactionsQuery {
  pageSize: number
  pageNumber: number
  executedAtFrom?: string
  executedAtTo?: string
  searchName?: string
}

const DEFAULT_PAGE_SIZE = 50

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function parseTransactionsSearchParams(
  raw: Record<string, string | string[] | undefined>,
): TransactionsQuery {
  const pageSizeRaw = Number(pickFirst(raw["page[size]"]))
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
      ? Math.floor(pageSizeRaw)
      : DEFAULT_PAGE_SIZE

  const pageNumberRaw = Number(pickFirst(raw["page[number]"]))
  const pageNumber =
    Number.isFinite(pageNumberRaw) && pageNumberRaw > 0
      ? Math.floor(pageNumberRaw)
      : 1

  const executedAt = pickFirst(raw["filter[executed_at]"])
  let executedAtFrom: string | undefined
  let executedAtTo: string | undefined
  if (executedAt) {
    const [from, to] = executedAt.split(",")
    if (from) executedAtFrom = from
    if (to) executedAtTo = to
  }

  const searchName = pickFirst(raw["search[name]"])?.trim() || undefined

  return { pageSize, pageNumber, executedAtFrom, executedAtTo, searchName }
}
