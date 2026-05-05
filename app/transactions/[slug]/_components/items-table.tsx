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
import type { TransactionItemWithCategory } from "@/lib/models/transaction_item"

import { deleteTransactionItems } from "../../actions"
import { DeleteConfirmDialog } from "../../_components/delete-confirm"

interface ItemsTableProps {
  items: TransactionItemWithCategory[]
  transactionId: string
}

export function ItemsTable({ items, transactionId }: ItemsTableProps) {
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
        cell: ({ row }) => {
          const category = row.original.transaction_item_category
          return (
            <Select value={category.id} disabled>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={category.id}>{category.name}</SelectItem>
              </SelectContent>
            </Select>
          )
        },
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
    [],
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
