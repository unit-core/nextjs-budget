"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp, FileIcon, Paperclip, Plus, Trash2, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { type UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload"
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
import { Spinner } from "@/components/ui/spinner"

type ButtonState = "idle" | "text" | "files"

type UploadProps = Pick<UseSupabaseUploadReturn, "files" | "setFiles" | "inputRef" | "getInputProps">

interface TransactionInputProps {
  uploadProps: UploadProps
  loading?: boolean
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

function useTypewriter(text: string, key: number, charDelay = 48) {
  const [displayed, setDisplayed] = useState("")
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    setDisplayed("")
    setTyping(true)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setTyping(false)
      }
    }, charDelay)
    return () => {
      clearInterval(id)
      setTyping(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { displayed, typing }
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
  uploadProps,
  loading = false,
  onSubmitText,
  onSubmitFiles,
}: TransactionInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [preview, setPreview] = useState<{ file: File; url: string | undefined } | null>(null)
  const [twKey, setTwKey] = useState(0)

  const { files, setFiles, inputRef, getInputProps } = uploadProps

  const openPreview = (file: File & { preview?: string }) => {
    setPreview({ file, url: file.preview })
  }

  const closePreview = () => setPreview(null)

  const isDesktop = useIsDesktop()

  const buttonState: ButtonState =
    files.length > 0 ? "files" :
    inputValue.trim().length > 0 ? "text" :
    "idle"

  const isVisible = buttonState !== "idle"

  const prevButtonState = useRef<ButtonState>(buttonState)
  useEffect(() => {
    if (prevButtonState.current === "files" && buttonState !== "files") {
      setTwKey((k) => k + 1)
    }
    prevButtonState.current = buttonState
  })

  const { displayed: placeholderText, typing: isTyping } = useTypewriter(
    "Coffee €4.50, groceries €32, rent €1200...",
    twKey,
  )

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
    <div className="grid w-full max-w-xl">
      <input {...getInputProps()} className="hidden" />

      <Dialog open={!!preview} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.file.name}</DialogTitle>
          </DialogHeader>
          {preview && <FilePreview file={preview.file} url={preview.url} />}
        </DialogContent>
      </Dialog>

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
        {/* Crossfading content area */}
        <div className="relative flex-1 min-w-0 self-stretch flex items-center overflow-hidden">

          {/* Text input view */}
          <div
            className={cn(
              "absolute inset-0 flex items-center transition-all duration-300 ease-out",
              buttonState === "files"
                ? "opacity-0 -translate-x-2 pointer-events-none"
                : "opacity-100 translate-x-0",
            )}
          >
            <div className="relative flex-1 flex items-center h-full">
              <InputGroupInput
                placeholder=""
                className="px-2 w-full"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
              />
              {!inputValue && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-muted-foreground overflow-hidden whitespace-nowrap select-none">
                  {placeholderText}
                  {isTyping && (
                    <span
                      className="ml-px"
                      style={{ animation: "blink 0.7s step-end infinite" }}
                    >
                      |
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Files pill view */}
          <div
            className={cn(
              "absolute inset-0 flex items-center pl-2 transition-all duration-300 ease-out",
              buttonState !== "files"
                ? "opacity-0 translate-x-2 pointer-events-none"
                : "opacity-100 translate-x-0",
            )}
          >
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
        </div>

        <InputGroupAddon align="inline-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton
                variant="ghost"
                aria-label="More"
                size="icon-xs"
                className="rounded-full size-8"
                disabled={loading}
              >
                <Plus />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
                  <Paperclip />
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
            disabled={loading}
            className={cn(
              "rounded-full h-8 overflow-hidden",
              "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              isVisible
                ? "w-8 opacity-100 scale-100"
                : "w-0 opacity-0 scale-75 pointer-events-none",
            )}
          >
            <span className="relative size-4">
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out",
                  loading ? "opacity-100 scale-100" : "opacity-0 scale-50",
                )}
              >
                <Spinner className="size-4" />
              </span>
              <ArrowUp
                className={cn(
                  "size-4 absolute inset-0 transition-all duration-200 ease-out",
                  !loading && buttonState === "text"
                    ? "opacity-100 scale-100 rotate-0"
                    : "opacity-0 scale-50 rotate-45",
                )}
              />
              <Upload
                className={cn(
                  "size-4 absolute inset-0 transition-all duration-200 ease-out",
                  !loading && buttonState === "files"
                    ? "opacity-100 scale-100 rotate-0"
                    : "opacity-0 scale-50 -rotate-45",
                )}
              />
            </span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
