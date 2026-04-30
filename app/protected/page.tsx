"use client"

import { useState } from "react"
import { toast } from "sonner"

import { PageDropzone } from "@/components/page-dropzone"
import { TransactionInput } from "@/components/transaction-input"
import { createClient } from "@/lib/supabase/client"
import type { TransactionInsert } from "@/lib/models/transaction"

export default function ProtectedPage() {
  const [loading, setLoading] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const handleSubmitText = async (text: string) => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error("Не удалось получить пользователя")

      const payload: TransactionInsert = {
        owner_id: user.id,
        source: { source_type: "text", source: { text } },
        folder_id: user.id,
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

  const handleSubmitFiles = async (files: File[]) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // TODO: upload files and save transactions to database
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageDropzone bucketName="transactions" maxFiles={10}>
      {(uploadProps) => (
        <div className="flex flex-col flex-1 items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <TransactionInput
              key={resetKey}
              uploadProps={uploadProps}
              loading={loading}
              onSubmitText={handleSubmitText}
              onSubmitFiles={handleSubmitFiles}
            />
          </div>
        </div>
      )}
    </PageDropzone>
  )
}
