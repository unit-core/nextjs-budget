"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

export function useTableUrl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") params.delete(key)
        else params.set(key, value)
      }
      const qs = params.toString()
      startTransition(() => {
        router.replace(qs ? `?${qs}` : "?", { scroll: false })
      })
    },
    [router, searchParams],
  )

  return { setParams, isPending }
}
