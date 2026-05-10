import { createClient } from "@/lib/supabase/server"
import { TransactionsClient } from "./transactions-client"

export default async function dashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data!.claims.sub

  return <TransactionsClient userId={userId} />
}
