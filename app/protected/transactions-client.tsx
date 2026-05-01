"use client"

import { useState } from "react"
import { toast } from "sonner"

import { PageDropzone } from "@/components/page-dropzone"
import { TransactionInput } from "@/components/transaction-input"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { UserMenu } from "@/components/user-menu"
import { createClient } from "@/lib/supabase/client"
import { uploadFiles } from "@/lib/uploads/upload-files"
import type { TransactionInsert } from "@/lib/models/transaction"

interface TransactionsClientProps {
  userId: string
  balance: number
  currency: string
}

export function TransactionsClient({ userId, balance, currency }: TransactionsClientProps) {
  const [loading, setLoading] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [files, setFiles] = useState<File[]>([])

  const uploadConfig = {
    bucketName: "transactions",
    path: userId,
    allowedMimeTypes: ["image/*", "application/pdf"],
    maxFiles: 10,
    maxFileSize: 1000 * 1000 * 5,
  }

  const handleFilesAdd = (incoming: File[]) => {
    setFiles((prev) => {
      const deduped = incoming.filter((f) => !prev.some((p) => p.name === f.name))
      return [...prev, ...deduped].slice(0, uploadConfig.maxFiles)
    })
  }

  const handleSubmitText = async (text: string) => {
    setLoading(true)
    try {
      const supabase = createClient()

      const payload: TransactionInsert = {
        owner_id: userId,
        source: { source_type: "text", source: { text } },
        folder_id: userId,
        name: text,
      }

      const { error } = await supabase.from("transactions").insert(payload)
      if (error) throw error

      toast.success("Транзакция сохранена", { position: "top-center" })
      setResetKey((k) => k + 1)
    } catch (err) {
      toast.error("Ошибка при сохранении", {
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
        position: "top-center",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFiles = async (toUpload: File[]) => {
    setLoading(true)
    try {
      const { errors } = await uploadFiles(toUpload, {
        bucketName: uploadConfig.bucketName,
        path: uploadConfig.path,
      })
      if (errors.length > 0) throw new Error(errors[0].message)

      toast.success("Файлы загружены", { position: "top-center" })
      setFiles([])
    } catch (err) {
      toast.error("Ошибка при загрузке", {
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
        position: "top-center",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageDropzone
      onFilesDrop={handleFilesAdd}
      allowedMimeTypes={uploadConfig.allowedMimeTypes}
      maxFiles={uploadConfig.maxFiles}
      maxFileSize={uploadConfig.maxFileSize}
    >
      <div className="absolute top-4 right-4 z-10">
        <div className="flex flex-row items-center">
          <HoverCard openDelay={10} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button variant="link" size="sm" className="text-muted-foreground">
                {balance} {currency}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="flex w-full flex-col gap-0.5">
              <div className="font-semibold">@nextjs</div>
              <div>The React Framework – created and maintained by @vercel.</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Joined December 2021
              </div>
            </HoverCardContent>
          </HoverCard>
          <UserMenu />
        </div>
      </div>
      <div className="flex flex-col flex-1 items-center justify-center p-4">
        <div className="relative w-full max-w-xl">
          <TransactionInput
            key={resetKey}
            files={files}
            onFilesChange={setFiles}
            loading={loading}
            allowedMimeTypes={uploadConfig.allowedMimeTypes}
            maxFiles={uploadConfig.maxFiles}
            onSubmitText={handleSubmitText}
            onSubmitFiles={handleSubmitFiles}
          />
        </div>
      </div>
    </PageDropzone>
  )
}
