"use client"

import { useMemo, useState, useTransition } from "react"
import { Calendar, Check, Copy, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AnyTransaction } from "@/lib/models/transaction"

import {
  deleteTransactionAndRedirect,
  updateTransaction,
  type TransactionFormValues,
  type TransactionItemFormValues,
} from "../../actions"

function toLocalInputValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function TransactionForm({ transaction }: { transaction: AnyTransaction }) {
  const initialValues = useMemo<TransactionFormValues>(
    () => ({
      name: transaction.name ?? "",
      executed_at: toLocalInputValue(transaction.executed_at),
      status: transaction.status,
      transaction_type: transaction.transaction_type,
      items: transaction.transaction_items.map((item) => ({
        id: item.id,
        name: item.name,
        amount: Number(item.amount),
        currency_code: item.currency_code,
      })),
    }),
    [transaction],
  )
  const [values, setValues] = useState<TransactionFormValues>(initialValues)
  const [isUpdating, startUpdate] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [copied, setCopied] = useState(false)

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  )

  const onCopyId = async () => {
    try {
      await navigator.clipboard.writeText(transaction.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const updateItem = (
    index: number,
    patch: Partial<TransactionItemFormValues>,
  ) => {
    setValues((v) => ({
      ...v,
      items: v.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startUpdate(async () => {
      try {
        await updateTransaction(transaction.id, {
          ...values,
          executed_at: new Date(values.executed_at).toISOString(),
        })
        toast.success("Transaction updated")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update")
      }
    })
  }

  const onDelete = () => {
    startDelete(async () => {
      try {
        await deleteTransactionAndRedirect(transaction.id)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">Edit transaction</h2>
        <div className="text-muted-foreground flex items-center gap-1 font-mono text-xs">
          <span>{transaction.id}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onCopyId}
            aria-label="Copy ID"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="executed_at">Executed at</Label>
          <div className="focus-within:border-ring focus-within:ring-ring/50 flex h-10 items-center gap-2 rounded-md border bg-transparent px-3 transition focus-within:ring-[3px]">
            <Calendar className="text-muted-foreground size-4 shrink-0" />
            <input
              id="executed_at"
              type="datetime-local"
              value={values.executed_at}
              onChange={(e) =>
                setValues((v) => ({ ...v, executed_at: e.target.value }))
              }
              required
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium">Items</h3>
          <p className="text-muted-foreground text-sm">
            {values.items.length} item{values.items.length === 1 ? "" : "s"}
          </p>
        </div>

        {values.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No items.</p>
        ) : (
          <div className="space-y-4">
            {values.items.map((item, index) => {
              const original = transaction.transaction_items[index]
              return (
                <div
                  key={item.id}
                  className="bg-muted/30 space-y-3 rounded-md p-4"
                >
                  <div className="text-muted-foreground text-xs">
                    {original?.transaction_item_category?.name ?? "Uncategorized"}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_100px]">
                    <div className="space-y-1.5">
                      <Label htmlFor={`item-name-${item.id}`} className="text-xs">
                        Name
                      </Label>
                      <Input
                        id={`item-name-${item.id}`}
                        value={item.name}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`item-amount-${item.id}`} className="text-xs">
                        Amount
                      </Label>
                      <Input
                        id={`item-amount-${item.id}`}
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(index, { amount: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`item-currency-${item.id}`} className="text-xs">
                        Currency
                      </Label>
                      <Input
                        id={`item-currency-${item.id}`}
                        value={item.currency_code}
                        onChange={(e) =>
                          updateItem(index, {
                            currency_code: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-4 z-10 mx-2 flex items-center justify-between gap-2 rounded-md border px-4 py-3 shadow-sm backdrop-blur">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete transaction?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The transaction and its items will be
                permanently removed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button type="submit" size="sm" disabled={isUpdating || !isDirty}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update
        </Button>
      </div>
    </form>
  )
}
