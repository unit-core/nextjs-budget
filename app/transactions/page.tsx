import { columns } from "./_components/columns"
import { DataTable } from "./_components/data-table"
import { parseTransactionsSearchParams } from "./parse-search-params"
import { fetchTransactionsPage } from "./query"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const query = parseTransactionsSearchParams(await searchParams)
  const page = await fetchTransactionsPage(query)

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={page.data}
        pageNumber={page.pageNumber}
        pageSize={page.pageSize}
        pageCount={page.pageCount}
        rowCount={page.count}
        searchName={query.searchName ?? ""}
      />
    </div>
  )
}
