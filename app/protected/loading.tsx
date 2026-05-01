import { Plus } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export default function Loading() {
  return (
    <div className="relative flex flex-col flex-1">
      <div className="absolute top-4 right-4 z-10">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="relative w-full max-w-xl">
          <div className="grid w-full max-w-xl">
            <InputGroup className="rounded-full h-12">
              <div className="relative flex-1 min-w-0 self-stretch flex items-center overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                  <div className="relative flex-1 flex items-center h-full">
                    <InputGroupInput
                      placeholder=""
                      className="px-2 w-full"
                      readOnly
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-muted-foreground select-none">
                      <span
                        style={{ animation: "blink 0.7s step-end infinite" }}
                      >
                        |
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <InputGroupAddon align="inline-start">
                <InputGroupButton
                  variant="ghost"
                  aria-label="More"
                  size="icon-xs"
                  className="rounded-full size-8"
                >
                  <Plus />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>
    </div>
  )
}
