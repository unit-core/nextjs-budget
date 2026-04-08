'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SubscriptionContextValue = {
  isPremium: boolean
  isLoading: boolean
  redirectToCheckout: () => Promise<void>
  redirectToPortal: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stripe/subscription')
      .then((res) => res.json())
      .then((data) => setIsPremium(data.isPremium))
      .catch(() => setIsPremium(false))
      .finally(() => setIsLoading(false))
  }, [])

  const redirectToCheckout = useCallback(async () => {
    router.push('/pricing')
  }, [router])

  const redirectToPortal = useCallback(async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  }, [])

  return (
    <SubscriptionContext.Provider value={{ isPremium, isLoading, redirectToCheckout, redirectToPortal }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
