"use client"

import { useEffect, useState } from "react"
import { ArrowUp, FileIcon, Plus, Trash2, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSupabaseUpload, type UseSupabaseUploadOptions } from "@/hooks/use-supabase-upload"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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

type ButtonState = "idle" | "text" | "files"

interface TransactionInputProps extends Partial<UseSupabaseUploadOptions> {
  onSubmitText?: (text: string) => void
  onSubmitFiles?: (files: File[]) => void
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isDesktop
}

function FilePreview({ file, url }: { file: File; url: string | undefined }) {
  if (file.type.startsWith("image/") && url) {
    return (
      <div className="flex items-center justify-center overflow-auto p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={file.name}
          className="max-h-[60vh] max-w-full rounded-md object-contain"
        />
      </div>
    )
  }

  if (file.type === "application/pdf" && url) {
    return (
      <iframe
        src={url}
        title={file.name}
        className="h-[65vh] w-full rounded-b-xl"
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10 text-muted-foreground">
      <FileIcon className="size-12 opacity-40" />
      <p className="text-sm">{file.name}</p>
      <p className="text-xs opacity-60">{(file.size / 1024).toFixed(0)} KB</p>
    </div>
  )
}

export function TransactionInput({
  onSubmitText,
  onSubmitFiles,
  bucketName = "transactions",
  ...uploadOptions
}: TransactionInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [preview, setPreview] = useState<{ file: File; url: string | undefined } | null>(null)

  const { files, setFiles, inputRef, getInputProps, getRootProps } = useSupabaseUpload({
    bucketName,
    maxFiles: 100,
    ...uploadOptions,
  })

  const openPreview = (file: File & { preview?: string }) => {
    setPreview({ file, url: file.preview })
  }

  const closePreview = () => {
    setPreview(null)
  }

  const isDesktop = useIsDesktop()

  const buttonState: ButtonState =
    files.length > 0 ? "files" :
    inputValue.trim().length > 0 ? "text" :
    "idle"

  const isVisible = buttonState !== "idle"

  const handleAction = () => {
    if (buttonState === "text") onSubmitText?.(inputValue)
    else if (buttonState === "files") onSubmitFiles?.(files)
  }

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const deleteSelected = () => {
    setFiles((prev) => prev.filter((_, i) => !selected.has(i)))
    setSelected(new Set())
  }

  const fileLabel =
    files.length === 1 ? "1 файл" :
    files.length < 5 ? `${files.length} файла` :
    `${files.length} файлов`

  return (
    <div className="grid w-full max-w-xl" {...getRootProps()}>
      <input {...getInputProps()} className="hidden" />

      {/* File preview dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.file.name}</DialogTitle>
          </DialogHeader>
          {preview && <FilePreview file={preview.file} url={preview.url} />}
        </DialogContent>
      </Dialog>

      {/* File list drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setSelected(new Set())
        }}
        direction={isDesktop ? "right" : "bottom"}
      >
        <DrawerContent direction={isDesktop ? "right" : "bottom"}>
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle>Файлы</DrawerTitle>
              {selected.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={deleteSelected}
                >
                  <Trash2 className="size-3.5" />
                  Удалить {selected.size}
                </Button>
              )}
            </div>
          </DrawerHeader>
          <div className="flex flex-col gap-0.5 px-2 pb-4 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={i}
                className="group flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(i)}
                  onCheckedChange={() => toggleSelect(i)}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                />
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2.5 min-w-0 text-left"
                  onClick={() => {
                    openPreview(file)
                    setDrawerOpen(false)
                  }}
                >
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </button>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <InputGroup className="rounded-full h-12">
        {buttonState === "files" ? (
          <div className="flex flex-1 items-center pl-2 min-w-0">
            <div className="flex items-center gap-1.5 rounded-full bg-muted pl-4 pr-3 py-1.5">
              <button
                type="button"
                className="text-sm leading-none text-foreground"
                onClick={() => setDrawerOpen(true)}
              >
                {fileLabel}
              </button>
              <button
                type="button"
                className="flex items-center justify-center leading-none text-muted-foreground hover:text-foreground transition-colors pl-1"
                onClick={() => setFiles([])}
                aria-label="Сбросить файлы"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        ) : (
          <InputGroupInput
            placeholder="Enter transaction..."
            className="px-2"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        )}
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
                <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
                  Add files
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="default"
            aria-label="Submit"
            size="icon-sm"
            onClick={handleAction}
            className={cn(
              "rounded-full h-8 transition-all duration-200 ease-in-out overflow-hidden",
              isVisible ? "w-8 opacity-100" : "w-0 opacity-0 pointer-events-none",
            )}
          >
            <span className="relative size-4">
              <ArrowUp
                className={cn(
                  "size-4 absolute inset-0 transition-all duration-150",
                  buttonState === "text" ? "opacity-100 scale-100" : "opacity-0 scale-50",
                )}
              />
              <Upload
                className={cn(
                  "size-4 absolute inset-0 transition-all duration-150",
                  buttonState === "files" ? "opacity-100 scale-100" : "opacity-0 scale-50",
                )}
              />
            </span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
