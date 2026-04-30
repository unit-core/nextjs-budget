"use client"

import { useState } from "react"

import { PageDropzone } from "@/components/page-dropzone"
import { TransactionInput } from "@/components/transaction-input"

export default function ProtectedPage() {
  const [loading, setLoading] = useState(false)

  const handleSubmitText = async (text: string) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // TODO: save text transaction to database
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
    <PageDropzone bucketName="transactions" maxFiles={100}>
      {(uploadProps) => (
        <div className="flex flex-col flex-1 items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <TransactionInput
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
