import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { TransactionsClient } from "./transactions-client"

export default async function dashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    redirect("/auth/login")
  }

  return <TransactionsClient userId={data.user.id} />
}
