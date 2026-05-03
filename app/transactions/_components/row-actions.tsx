"use client"

import { MoreHorizontal } from "lucide-react"

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

interface RowActionsProps {
  transaction: AnyTransaction
}

export function RowActions({ transaction }: RowActionsProps) {
  const isMobile = useIsMobile()

  const onCopyId = () => navigator.clipboard.writeText(transaction.id)

  if (isMobile) {
    return (
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
              <Button variant="outline">View details</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button variant="destructive">Delete</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
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
          <DropdownMenuItem>View details</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
