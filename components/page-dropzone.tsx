"use client"

import { type ReactNode } from "react"
import { Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { useSupabaseUpload, type UseSupabaseUploadOptions, type UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload"

interface PageDropzoneProps extends UseSupabaseUploadOptions {
  children: (uploadProps: UseSupabaseUploadReturn) => ReactNode
  className?: string
}

export function PageDropzone({ children, className, ...uploadOptions }: PageDropzoneProps) {
  const uploadProps = useSupabaseUpload(uploadOptions)
  const { getRootProps, getInputProps, isDragActive } = uploadProps

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

      {children(uploadProps)}
    </div>
  )
}
