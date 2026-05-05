"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TransactionItemWithCategory } from "@/lib/models/transaction_item"
import type { AnyTransactionItemCategoryGroup } from "@/lib/models/transaction_item_category_group"

import { deleteTransactionItems, updateTransactionItemCategory } from "../../actions"
import { DeleteConfirmDialog } from "../../_components/delete-confirm"

interface ItemsTableProps {
  items: TransactionItemWithCategory[]
  transactionId: string
  categoryGroups: AnyTransactionItemCategoryGroup[]
}

function CategoryPicker({
  itemId,
  currentCategoryId,
  groups,
  transactionId,
}: {
  itemId: string
  currentCategoryId: string
  groups: AnyTransactionItemCategoryGroup[]
  transactionId: string
}) {
  const [value, setValue] = React.useState(currentCategoryId)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    setValue(currentCategoryId)
  }, [currentCategoryId])

  const onChange = (next: string) => {
    if (next === value) return
    const prev = value
    setValue(next)
    startTransition(async () => {
      try {
        await updateTransactionItemCategory(itemId, next, transactionId)
      } catch (error) {
        setValue(prev)
        toast.error(error instanceof Error ? error.message : "Failed to update category")
      }
    })
  }

  const sortedGroups = React.useMemo(
    () =>
      [...groups].sort((a, b) => {
        if (a.type === b.type) return 0
        return a.type === "EXPENSE" ? -1 : 1
      }),
    [groups],
  )

  const selectedName = React.useMemo(() => {
    for (const g of sortedGroups) {
      const found = g.categories.find((c) => c.id === value)
      if (found) return found.name
    }
    return ""
  }, [sortedGroups, value])

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="h-8 w-[220px]">
        <span className="truncate">{selectedName}</span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="max-h-[600px] w-[350px] max-w-[calc(100vw-2rem)]"
      >
        {sortedGroups.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel className="flex items-center gap-2">
              <span
                aria-hidden
                className={
                  "size-1.5 rounded-full " +
                  (group.type === "INCOME" ? "bg-emerald-500" : "bg-rose-500")
                }
              />
              <span>{group.name}</span>
            </SelectLabel>
            {group.categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex flex-col">
                  <span>{cat.name}</span>
                  {cat.description && (
                    <span className="text-xs text-muted-foreground">
                      {cat.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ItemsTable({ items, transactionId, categoryGroups }: ItemsTableProps) {
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingIds, setPendingIds] = React.useState<string[]>([])
  const [isDeleting, startDelete] = React.useTransition()

  const columns = React.useMemo<ColumnDef<TransactionItemWithCategory>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <CategoryPicker
            itemId={row.original.id}
            currentCategoryId={row.original.transaction_item_category.id}
            groups={categoryGroups}
            transactionId={transactionId}
          />
        ),
      },
      {
        id: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
          const { amount, currency_code } = row.original
          return (
            <div className="text-right font-medium tabular-nums">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency_code,
              }).format(Number(amount))}
            </div>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setPendingIds([row.original.id])
                  setConfirmOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [categoryGroups, transactionId],
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const onConfirmDelete = () => {
    startDelete(async () => {
      try {
        await deleteTransactionItems(pendingIds, transactionId)
        setRowSelection((prev) => {
          const next = { ...prev }
          for (const id of pendingIds) delete next[id]
          return next
        })
        setConfirmOpen(false)
        toast.success(
          pendingIds.length === 1 ? "Item deleted" : `${pendingIds.length} items deleted`,
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete")
      }
    })
  }

  const rows = table.getRowModel().rows

  return (
    <>
      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${pendingIds.length} item${pendingIds.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        isPending={isDeleting}
        onConfirm={onConfirmDelete}
      />

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {selectedCount > 0
              ? `${selectedCount} selected`
              : `${items.length} ${items.length === 1 ? "item" : "items"}`}
          </CardDescription>
          {selectedCount > 0 && (
            <CardAction>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setPendingIds(selectedRows.map((r) => r.original.id))
                  setConfirmOpen(true)
                }}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
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
                  No items.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </>
  )
}
