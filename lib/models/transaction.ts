export type TransactionStatus = 'IDLE' | 'PENDING' | 'UNDERSTANDING' | 'CONFIRMED' | 'UNSUPPORTED_DOCUMENT' | 'PARSE_ERROR'

export type TransactionType = 'EXPENSE' | 'INCOME'

interface TextSource {
  source_type: 'text'
  source: {
    text: string
  }
}

interface FileSource {
  source_type: 'file'
  source: {
    id: string
    name: string
    mimeType: string
    bucket_id: string
  }
}

export type TransactionSource = TextSource | FileSource

export interface BaseTransaction {
  id: string
  created_at: string
  owner_id: string
  source: TransactionSource | null
  executed_at: string
  folder_id: string
  status: TransactionStatus
  name: string
  transaction_type: TransactionType
}

export type TransactionInsert = Omit<BaseTransaction, 'id' | 'created_at' | 'executed_at' | 'transaction_type' | 'status'> & {
  id?: string
  created_at?: string
  executed_at?: string
  transaction_type?: string
  status?: string
}

export type TransactionUpdate = Partial<TransactionInsert>
