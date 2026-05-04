"use client"

import { MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"
import type { AnyTransaction } from "@/lib/models/transaction"

import { deleteTransactions } from "../actions"
import { DeleteConfirmDialog } from "./delete-confirm"

interface RowActionsProps {
  transaction: AnyTransaction
}

export function RowActions({ transaction }: RowActionsProps) {
  const isMobile = useIsMobile()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const onCopyId = () => navigator.clipboard.writeText(transaction.id)

  const onConfirmDelete = () => {
    startDelete(async () => {
      try {
        await deleteTransactions([transaction.id])
        setConfirmOpen(false)
        toast.success("Transaction deleted")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete")
      }
    })
  }

  return (
    <>
      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete transaction?"
        description={`"${transaction.name || "Transaction"}" and its items will be permanently removed.`}
        isPending={isDeleting}
        onConfirm={onConfirmDelete}
      />

      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{transaction.name || "Transaction"}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-2 px-4 pb-6">
              <DrawerClose asChild>
                <Button variant="outline" onClick={onCopyId}>Copy ID</Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button variant="outline" asChild>
                  <Link href={`/transactions/${transaction.id}/edit`}>View details</Link>
                </Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onCopyId}>Copy ID</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/transactions/${transaction.id}/edit`}>View details</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault()
                setConfirmOpen(true)
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}
