"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
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
import type { AnyTransaction } from "@/lib/models/transaction"

import { deleteTransactions } from "../actions"
import { FiltersDrawer } from "./filters-drawer"
import { TransactionCard } from "./transaction-card"
import { useTableUrl } from "./use-table-url"

interface DataTableProps {
  columns: ColumnDef<AnyTransaction>[]
  data: AnyTransaction[]
  pageNumber: number
  pageCount: number
  rowCount: number
  searchName: string
}

export function DataTable({
  columns,
  data,
  pageNumber,
  pageCount,
  rowCount,
  searchName,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchInput, setSearchInput] = React.useState(searchName)
  const [isDeleting, startDelete] = React.useTransition()
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
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  })

  const goToPage = (n: number) =>
    setParams({ "page[number]": String(Math.max(1, Math.min(pageCount, n))) })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const onDelete = () => {
    const ids = selectedRows.map((r) => r.original.id)
    startDelete(async () => {
      await deleteTransactions(ids)
      setRowSelection({})
    })
  }

  const rows = table.getRowModel().rows
  const busy = isPending || isDeleting

  return (
    <div className="space-y-4" aria-busy={busy}>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="hidden max-w-sm md:block"
        />
        <div className="ml-auto md:hidden">
          <FiltersDrawer searchValue={searchInput} onSearchChange={setSearchInput} />
        </div>
      </div>

      <div
        className={
          "md:hidden space-y-2 transition-opacity " +
          (busy ? "pointer-events-none opacity-50" : "")
        }
      >
        {rows.length ? (
          rows.map((row) => <TransactionCard key={row.id} row={row} />)
        ) : (
          <div className="rounded-md border p-8 text-center text-muted-foreground">No results.</div>
        )}
      </div>

      <div
        className={
          "hidden md:block overflow-hidden rounded-md border transition-opacity " +
          (busy ? "pointer-events-none opacity-50" : "")
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
            {rows.length ? (
              rows.map((row) => (
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
        <div className="flex flex-1 items-center gap-3 text-sm">
          {selectedCount > 0 ? (
            <>
              <span className="font-medium">{selectedCount} selected</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground">{rowCount} total</span>
          )}
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
              disabled={pageNumber <= 1 || busy}
            >
              <span className="sr-only">First page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1 || busy}
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= pageCount || busy}
            >
              <span className="sr-only">Next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => goToPage(pageCount)}
              disabled={pageNumber >= pageCount || busy}
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
