"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Columns3Icon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  transaction_type: z.string(),
  created_at: z.string(),
  amount: z.string(),
  folder_id: z.string(),
})

type TemplateRow = z.infer<typeof templateSchema>

function TemplateActionsCell({
  row,
  table,
}: {
  row: Row<TemplateRow>
  table: ReturnType<typeof useReactTable<TemplateRow>>
}) {
  const t = useTranslations("Templates")
  const [isExecuting, setIsExecuting] = React.useState(false)
  const router = useRouter()

  const deleteTemplate = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from("transaction_templates")
      .delete()
      .eq("id", row.original.id)
    if (error) {
      toast(t("templateDeleteFailed"), { position: "top-center" })
      return
    }
    ;(table.options.meta as any)?.removeRow(row.original.id)
    toast(t("templateDeleted"), {
      position: "top-center",
      description: t("templateDeletedDesc"),
    })
  }

  const executeTemplate = async () => {
    setIsExecuting(true)
    const supabase = createClient()

    const { data: items, error: itemsError } = await supabase
      .from("transaction_item_templates")
      .select("name, amount, currency_code, transaction_item_category_id, transaction_folder_id")
      .eq("transaction_template_id", row.original.id)

    if (itemsError) {
      toast(t("executeFailed"), { position: "top-center" })
      setIsExecuting(false)
      return
    }

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        name: row.original.name,
        transaction_type: row.original.transaction_type,
        status: "CONFIRMED",
        executed_at: new Date().toISOString(),
        folder_id: row.original.folder_id,
      })
      .select("id")
      .single()

    if (txError || !tx) {
      toast(t("executeFailed"), { position: "top-center" })
      setIsExecuting(false)
      return
    }

    if (items && items.length > 0) {
      const { error: insertError } = await supabase
        .from("transaction_items")
        .insert(
          items.map((item) => ({
            transaction_id: tx.id,
            transaction_folder_id: item.transaction_folder_id,
            name: item.name,
            amount: item.amount,
            currency_code: item.currency_code,
            transaction_item_category_id: item.transaction_item_category_id,
            executed_at: new Date().toISOString(),
          })),
        )

      if (insertError) {
        await supabase.from("transactions").delete().eq("id", tx.id)
        toast(t("executeFailed"), { position: "top-center" })
        setIsExecuting(false)
        return
      }
    }

    toast(t("transactionCreated"), {
      position: "top-center",
      description: t("transactionCreatedDesc"),
    })
    setIsExecuting(false)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
          size="icon"
          disabled={isExecuting}
        >
          {isExecuting ? <Spinner /> : <EllipsisVerticalIcon />}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={executeTemplate}>
          <PlayIcon className="size-4" />
          {t("execute")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={deleteTemplate}>
          <TrashIcon className="size-4" />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function createColumns(t: {
  header: string
  type: string
  amount: string
  createdAt: string
}): ColumnDef<TemplateRow>[] {
  return [
    {
      accessorKey: "name",
      header: t.header,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "transaction_type",
      header: t.type,
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.transaction_type}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: t.amount,
      cell: ({ row }) => (
        <div className="whitespace-pre-line">{row.original.amount}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: t.createdAt,
      cell: ({ row }) => <div>{row.original.created_at}</div>,
    },
    {
      id: "actions",
      cell: ({ row, table }) => (
        <TemplateActionsCell
          row={row}
          table={table as ReturnType<typeof useReactTable<TemplateRow>>}
        />
      ),
    },
  ]
}

export function TemplatesDataTable({
  data: initialData,
}: {
  data: TemplateRow[]
}) {
  const t = useTranslations("Templates")
  const [data, setData] = React.useState(() => initialData)
  const router = useRouter()

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const columns = React.useMemo(
    () =>
      createColumns({
        header: t("header"),
        type: t("type"),
        amount: t("amount"),
        createdAt: t("createdAt"),
      }),
    [t],
  )

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      removeRow: (id: string) => {
        setData((prev) => prev.filter((row) => row.id !== id))
        router.refresh()
      },
    },
  })

  return (
    <div className="flex flex-col gap-4 py-4 md:py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3Icon data-icon="inline-start" />
              {t("columns")}
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide(),
              )
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex" />
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label
              htmlFor="rows-per-page-templates"
              className="text-sm font-medium"
            >
              {t("rowsPerPage")}
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="w-20"
                id="rows-per-page-templates"
              >
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            {t("pageOf", {
              current: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>
          <div className="ms-auto flex items-center gap-2 lg:ms-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
