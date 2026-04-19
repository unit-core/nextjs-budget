"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
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
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useTranslations } from "next-intl"
import { useIsMobile } from "@/hooks/use-mobile"
import { useDirection } from "@/hooks/use-direction"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { GripVerticalIcon, CircleCheckIcon, LoaderIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, PlusIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, TrendingUpIcon, CheckIcon, TrashIcon } from "lucide-react"
import { createClient } from '@/lib/supabase/client'
import { Spinner } from "@/components/ui/spinner"
import TransactionForm from "@/components/transaction-form"
import { useRouter } from "next/navigation"

export const schema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  transaction_type: z.string(),
  executed_at: z.string(),
  amount: z.string(),
})

function AddTransactionButton() {
  const isMobile = useIsMobile()
  const direction = useDirection()
  const t = useTranslations("Dashboard")
  const [open, setOpen] = React.useState(false)

  return (
    <Drawer direction={isMobile ? "bottom" : direction === "rtl" ? "left" : "right"} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          <span className="hidden lg:inline">{t("addTransaction")}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("newTransaction")}</DrawerTitle>
          <DrawerDescription>{t("newTransactionDesc")}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">
          <TransactionForm onSuccess={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function createColumns(t: { header: string; executedAt: string; amount: string; delete: string; transactionDeleted: string; transactionDeletedDesc: string; editTransactionDesc: string; createTemplate: string; templateCreated: string; templateCreatedDesc: string; templateCreateFailed: string }): ColumnDef<z.infer<typeof schema>>[] { return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: t.header,
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} editTransactionDesc={t.editTransactionDesc} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "executed at",
    header: t.executedAt,
    cell: ({ row }) => {
      return <div>{row.original.executed_at}</div>
    },
    enableHiding: true,
  },
  {
    accessorKey: "amount",
    header: t.amount,
    cell: ({ row }) => {
      return <div className="whitespace-pre-line">{row.original.amount}</div>
    },
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const deleteTransaction = async () => {
        const supabase = createClient()
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', row.id)
        if (!error) {
          (table.options.meta as any)?.removeRow(row.id)
          toast(t.transactionDeleted, {
            position: 'top-center',
            description: t.transactionDeletedDesc
          })
        }
      }
      const createTemplate = async () => {
        const supabase = createClient()
        const { data: tx, error: fetchError } = await supabase
          .from('transactions')
          .select(`
            name,
            transaction_type,
            folder_id,
            transaction_items (
              name,
              amount,
              currency_code,
              transaction_item_category_id
            )
          `)
          .eq('id', row.id)
          .single()

        if (fetchError || !tx) {
          toast(t.templateCreateFailed, { position: 'top-center' })
          return
        }

        const { data: template, error: templateError } = await supabase
          .from('transaction_templates')
          .insert({
            folder_id: tx.folder_id,
            name: tx.name,
            transaction_type: tx.transaction_type,
          })
          .select('id')
          .single()

        if (templateError || !template) {
          toast(t.templateCreateFailed, { position: 'top-center' })
          return
        }

        const items = (tx.transaction_items ?? []).map((it: any) => {
          const row: Record<string, unknown> = {
            transaction_template_id: template.id,
            transaction_folder_id: tx.folder_id,
            name: it.name,
            amount: it.amount,
            currency_code: it.currency_code,
          }
          if (it.transaction_item_category_id) {
            row.transaction_item_category_id = it.transaction_item_category_id
          }
          return row
        })

        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('transaction_item_templates')
            .insert(items)
          if (itemsError) {
            await supabase.from('transaction_templates').delete().eq('id', template.id)
            toast(t.templateCreateFailed, { position: 'top-center' })
            return
          }
        }

        toast(t.templateCreated, {
          position: 'top-center',
          description: t.templateCreatedDesc,
        })
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
              size="icon"
            >
              <EllipsisVerticalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => createTemplate()}>{t.createTemplate}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => deleteTransaction()}>{t.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
}

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}


function createPendingColumns(t: { header: string; type: string; status: string; executedAt: string; amount: string }): ColumnDef<z.infer<typeof schema>>[] { return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.getCanSelect() && (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: t.header,
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: t.type,
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.transaction_type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: t.status,
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        <LoaderIcon />
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "executed at",
    header: t.executedAt,
    cell: ({ row }) => <div>{row.original.executed_at}</div>,
    enableHiding: true,
  },
  {
    accessorKey: "amount",
    header: t.amount,
    cell: ({ row }) => <div className="whitespace-pre-line">{row.original.amount}</div>,
    enableHiding: true,
  },
]
}

function PendingTransactionsTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const t = useTranslations("Dashboard")
  const pendingCols = React.useMemo(() => createPendingColumns({
    header: t("header"),
    type: t("type"),
    status: t("status"),
    executedAt: t("executedAt"),
    amount: t("amount"),
  }), [t])
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [isConfirming, setIsConfirming] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const table = useReactTable({
    data,
    columns: pendingCols,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: (row) => row.original.status === 'PENDING',
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const [isDeleting, setIsDeleting] = React.useState(false)

  const getSelectedIds = () =>
    table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)

  const confirmSelected = async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return

    setIsConfirming(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'CONFIRMED' })
      .in('id', selectedIds)

    if (!error) {
      setData((prev) => prev.filter((row) => !selectedIds.includes(row.id)))
      setRowSelection({})
      toast(t("transactionsConfirmed"), {
        position: 'top-center',
        description: t("transactionsConfirmedDesc", { count: selectedIds.length }),
      })
      router.refresh()
    }
    setIsConfirming(false)
  }

  const deleteSelected = async () => {
    const selectedIds = getSelectedIds()
    if (selectedIds.length === 0) return

    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', selectedIds)

    if (!error) {
      setData((prev) => prev.filter((row) => !selectedIds.includes(row.id)))
      setRowSelection({})
      toast(t("transactionsDeleted"), {
        position: 'top-center',
        description: t("transactionsDeletedDesc", { count: selectedIds.length }),
      })
      router.refresh()
    }
    setIsDeleting(false)
  }

  if (data.length === 0) return null

  const isBusy = isConfirming || isDeleting

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{t("pendingTransactions")}</h3>
          <Badge variant="secondary">{data.length}</Badge>
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={confirmSelected} disabled={isBusy}>
              {isConfirming ? <Spinner /> : <CheckIcon className="size-4" />}
              {t("confirm")} {selectedCount}
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={isBusy}>
              {isDeleting ? <Spinner /> : <TrashIcon className="size-4" />}
              {t("delete")} {selectedCount}
            </Button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function AllTransactionsDataTableSkeleton() {
  const t = useTranslations("Dashboard")
  const columns = React.useMemo(() => createColumns({
    header: t("header"),
    executedAt: t("executedAt"),
    amount: t("amount"),
    delete: t("delete"),
    transactionDeleted: t("transactionDeleted"),
    transactionDeletedDesc: t("transactionDeletedDesc", { count: 0 }),
    editTransactionDesc: t("editTransactionDesc"),
    createTemplate: t("createTemplate"),
    templateCreated: t("templateCreated"),
    templateCreatedDesc: t("templateCreatedDesc"),
    templateCreateFailed: t("templateCreateFailed"),
  }), [t])
  const [data, setData] = React.useState(() => [])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="outline">{t("allTransactions")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">{t("allTransactions")}</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
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
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <AddTransactionButton /> */}
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t("loading")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {/* {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected. */}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                {t("rowsPerPage")}
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
              {t("pageOf", { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
            </div>
            <div className="ms-auto flex items-center gap-2 lg:ms-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon
                />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon
                />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

export function AllTransactionsDataTable({
  data: initialData,
  pendingData = [],
}: {
  data: z.infer<typeof schema>[]
  pendingData?: z.infer<typeof schema>[]
}) {
  const t = useTranslations("Dashboard")
  const columns = React.useMemo(() => createColumns({
    header: t("header"),
    executedAt: t("executedAt"),
    amount: t("amount"),
    delete: t("delete"),
    transactionDeleted: t("transactionDeleted"),
    transactionDeletedDesc: t("transactionDeletedDesc", { count: 0 }),
    editTransactionDesc: t("editTransactionDesc"),
    createTemplate: t("createTemplate"),
    templateCreated: t("templateCreated"),
    templateCreatedDesc: t("templateCreatedDesc"),
    templateCreateFailed: t("templateCreateFailed"),
  }), [t])
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false)
  const router = useRouter()

  // Sync data when initialData changes (e.g. after locale switch)
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      removeRow: (id: string) => {
        setData((prev) => prev.filter((row) => row.id.toString() !== id))
      },
    },
  })

  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const deleteSelected = async () => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map((row) => row.original.id)
    if (selectedIds.length === 0) return

    setIsDeletingSelected(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', selectedIds)

    if (!error) {
      setData((prev) => prev.filter((row) => !selectedIds.includes(row.id)))
      setRowSelection({})
      toast(t("transactionsDeleted"), {
        position: 'top-center',
        description: t("transactionsDeletedDesc", { count: selectedIds.length }),
      })
      router.refresh()
    }
    setIsDeletingSelected(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <>
    <PendingTransactionsTable data={pendingData} />
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="outline">{t("allTransactions")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">{t("allTransactions")}</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
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
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedCount > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={isDeletingSelected}>
              {isDeletingSelected ? <Spinner /> : <TrashIcon className="size-4" />}
              {t("delete")} {selectedCount}
            </Button>
          )}
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
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
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {/* {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected. */}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                {t("rowsPerPage")}
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
              {t("pageOf", { current: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}
            </div>
            <div className="ms-auto flex items-center gap-2 lg:ms-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon
                />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon
                />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon
                />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
    </>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item, editTransactionDesc }: { item: z.infer<typeof schema>; editTransactionDesc?: string }) {
  const isMobile = useIsMobile()
  const direction = useDirection()
  const [open, setOpen] = React.useState(false)
  const [transactionData, setTransactionData] = React.useState<{
    id: string
    name: string
    transaction_type: string
    executed_at: string
    status: string
    folder_id: string
    items: { id: string; name: string; amount: string; currency_code: string; transaction_item_category_id: string | null }[]
  } | null>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchTransaction = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        name,
        transaction_type,
        executed_at,
        status,
        folder_id,
        transaction_items (
          id,
          name,
          amount,
          currency_code,
          transaction_item_category_id
        )
      `)
      .eq('id', item.id)
      .single()

    if (data) {
      setTransactionData({
        id: data.id,
        name: data.name,
        transaction_type: data.transaction_type,
        executed_at: data.executed_at,
        status: data.status,
        folder_id: data.folder_id,
        items: data.transaction_items.map((i: any) => ({
          id: i.id,
          name: i.name,
          amount: String(i.amount),
          currency_code: i.currency_code,
          transaction_item_category_id: i.transaction_item_category_id ?? null,
        })),
      })
    }
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchTransaction()
    } else {
      setTransactionData(null)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : direction === "rtl" ? "left" : "right"} open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-start text-foreground">
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>{editTransactionDesc}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : transactionData ? (
            <TransactionForm
              initialData={transactionData}
              onSuccess={() => setOpen(false)}
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
