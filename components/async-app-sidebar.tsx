import { redirect } from "next/navigation"
import { Suspense } from "react"

import { AppSidebar, type SidebarUser } from "@/components/app-sidebar"
import { getDirection } from "@/i18n/actions"
import { createClient } from "@/lib/supabase/server"

async function FetchedAppSidebar() {
  const supabase = await createClient()
  const direction = await getDirection()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const sidebarUser: SidebarUser = { id: user.id, email: user.email ?? "-" }
  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })

  return (
    <AppSidebar
      variant="inset"
      user={sidebarUser}
      direction={direction}
      hasTransactions={(count ?? 0) > 0}
    />
  )
}

export function AsyncAppSidebar() {
  return (
    <Suspense fallback={<AppSidebar variant="inset" user={null} />}>
      <FetchedAppSidebar />
    </Suspense>
  )
}
