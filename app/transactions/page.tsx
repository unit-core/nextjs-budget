import { createClient } from "@/lib/supabase/server"
import type { AnyTransaction } from "@/lib/models/transaction"

import { columns } from "./_components/columns"
import { DataTable } from "./_components/data-table"
import { TRANSACTIONS_SELECT } from "./query"

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTIONS_SELECT)
    .order("executed_at", { ascending: false })

  if (error) throw error

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={(data ?? []) as AnyTransaction[]} />
    </div>
  )
}
