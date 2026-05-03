"use client"

import * as React from "react"
import {
  ColumnDef,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"

import { FiltersDrawer } from "./filters-drawer"
import { TransactionCard } from "./transaction-card"
import { useTableUrl } from "./use-table-url"
import type { AnyTransaction } from "@/lib/models/transaction"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageNumber: number
  pageCount: number
  rowCount: number
  searchName: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageNumber,
  pageCount,
  rowCount,
  searchName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchInput, setSearchInput] = React.useState(searchName)
  const { setParams, isPending } = useTableUrl()

  React.useEffect(() => {
    setSearchInput(searchName)
  }, [searchName])

  React.useEffect(() => {
    setRowSelection({})
  }, [pageNumber])

  React.useEffect(() => {
    if (searchInput === searchName) return
    const t = setTimeout(() => {
      setParams({
        "search[name]": searchInput || undefined,
        "page[number]": undefined,
      })
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput, searchName, setParams])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  })

  const goToPage = (n: number) =>
    setParams({ "page[number]": String(Math.max(1, Math.min(pageCount, n))) })

  const rows = table.getRowModel().rows

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="hidden max-w-sm md:block"
        />
        <div className="hidden md:block">
          <DataTableViewOptions table={table} />
        </div>
        <div className="ml-auto md:hidden">
          <FiltersDrawer searchValue={searchInput} onSearchChange={setSearchInput} />
        </div>
      </div>

      <div
        className={
          "md:hidden space-y-2 transition-opacity " +
          (isPending ? "pointer-events-none opacity-50" : "")
        }
      >
        {rows.length ? (
          rows.map((row) => (
            <TransactionCard key={row.id} row={row as unknown as Row<AnyTransaction>} />
          ))
        ) : (
          <div className="rounded-md border p-8 text-center text-muted-foreground">No results.</div>
        )}
      </div>

      <div
        className={
          "hidden md:block overflow-hidden rounded-md border transition-opacity " +
          (isPending ? "pointer-events-none opacity-50" : "")
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="sticky bottom-4 z-10 mx-2 flex items-center justify-between gap-2 rounded-md border bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} selected · {rowCount} total
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[110px] items-center justify-center text-sm font-medium">
            Page {pageNumber} of {pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(1)}
              disabled={pageNumber <= 1 || isPending}
            >
              <span className="sr-only">First page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1 || isPending}
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= pageCount || isPending}
            >
              <span className="sr-only">Next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(pageCount)}
              disabled={pageNumber >= pageCount || isPending}
            >
              <span className="sr-only">Last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
