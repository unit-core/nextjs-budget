import { Plus, MoreHorizontal, ArrowUp } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export function TransactionInput() {
  return (
    <div className="grid w-full max-w-xl">
      <InputGroup className="rounded-full h-12">
        <InputGroupInput placeholder="Enter file name" className="px-2" />
        <InputGroupAddon align="inline-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton
                variant="ghost"
                aria-label="More"
                size="icon-xs"
                className="rounded-full size-8"
              >
                <Plus />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Copy path</DropdownMenuItem>
                <DropdownMenuItem>Open location</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="default"
            aria-label="Send"
            size="icon-sm"
            className="rounded-full size-8"
          >
            <ArrowUp className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
