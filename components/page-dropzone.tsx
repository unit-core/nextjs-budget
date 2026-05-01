"use client"

import { useCallback, type ReactNode } from "react"
import { Upload } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"

interface PageDropzoneProps {
  onFilesDrop: (files: File[]) => void
  allowedMimeTypes?: string[]
  maxFiles?: number
  maxFileSize?: number
  children: ReactNode
  className?: string
}

export function PageDropzone({
  onFilesDrop,
  allowedMimeTypes = [],
  maxFiles = 1,
  maxFileSize = Number.POSITIVE_INFINITY,
  children,
  className,
}: PageDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFilesDrop(accepted)
    },
    [onFilesDrop],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles !== 1,
  })

  return (
    <div
      {...getRootProps()}
      className={cn("relative flex flex-col flex-1", className)}
    >
      <input {...getInputProps()} className="hidden" />

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none backdrop-blur-xs bg-background/60">
          <div className="absolute inset-3 rounded-xl border-2 border-dashed border-primary" />
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="size-8" />
            <p className="text-sm font-medium">Перетащите файлы сюда</p>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
