"use client"

import { PageDropzone } from "@/components/page-dropzone"
import { TransactionInput } from "@/components/transaction-input"

export default function ProtectedPage() {
  return (
    <PageDropzone bucketName="transactions" maxFiles={100}>
      {(uploadProps) => (
        <div className="flex flex-col flex-1 items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <TransactionInput uploadProps={uploadProps} />
          </div>
        </div>
      )}
    </PageDropzone>
  )
}
