"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { endOfDay, format, parseISO, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
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
import { DeleteConfirmDialog } from "./delete-confirm"
import { FiltersSidebar } from "./filters-sidebar"
import { TransactionCard } from "./transaction-card"
import { useTableUrl } from "./use-table-url"

interface DataTableProps {
  columns: ColumnDef<AnyTransaction>[]
  data: AnyTransaction[]
  pageNumber: number
  pageCount: number
  rowCount: number
  executedAtFrom?: string
  executedAtTo?: string
}

export function DataTable({
  columns,
  data,
  pageNumber,
  pageCount,
  rowCount,
  executedAtFrom,
  executedAtTo,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [isDeleting, startDelete] = React.useTransition()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const { setParams, isPending } = useTableUrl()

  React.useEffect(() => {
    setRowSelection({})
  }, [pageNumber])

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!executedAtFrom && !executedAtTo) return undefined
    return {
      from: executedAtFrom ? parseISO(executedAtFrom) : undefined,
      to: executedAtTo ? parseISO(executedAtTo) : undefined,
    }
  }, [executedAtFrom, executedAtTo])

  const onRangeChange = React.useCallback(
    (next: DateRange | undefined) => {
      // Encode each boundary as a full ISO timestamp in the user's local TZ
      // (e.g. "2026-05-22T00:00:00+02:00") so Postgres timestamptz comparison
      // covers the entire day regardless of the viewer's timezone.
      const ISO_FMT = "yyyy-MM-dd'T'HH:mm:ssXXX"
      const from = next?.from ? format(startOfDay(next.from), ISO_FMT) : ""
      const to = next?.to ? format(endOfDay(next.to), ISO_FMT) : ""
      const value = !from && !to ? undefined : `${from},${to}`
      setParams({
        "range[executed_at]": value,
        "page[number]": undefined,
      })
    },
    [setParams],
  )

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
      setConfirmOpen(false)
    })
  }

  const rows = table.getRowModel().rows
  const busy = isPending || isDeleting

  return (
    <>
    <DeleteConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={`Delete ${selectedCount} transaction${selectedCount === 1 ? "" : "s"}?`}
      description="This action cannot be undone. The selected transactions and their items will be permanently removed."
      isPending={isDeleting}
      onConfirm={onDelete}
    />
    <SidebarProvider
      style={
        {
          "--sidebar-width": "24rem",
          "--sidebar-width-mobile": "20rem",
          "--sidebar": "color-mix(in oklch, var(--background) 80%, transparent)",
        } as React.CSSProperties
      }
    >
      <FiltersSidebar range={dateRange} onRangeChange={onRangeChange} />
      <SidebarInset>
    <div className="space-y-4 px-4 py-6" aria-busy={busy}>
      <div className="flex items-center gap-2">
        <SidebarTrigger />
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
                onClick={() => setConfirmOpen(true)}
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
      </SidebarInset>
    </SidebarProvider>
    </>
  )
}
