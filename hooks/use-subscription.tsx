'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SubscriptionContextValue = {
  isPremium: boolean
  isTrial: boolean
  trialDaysLeft: number
  isLoading: boolean
  redirectToCheckout: () => Promise<void>
  redirectToPortal: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/stripe/subscription')
      .then((res) => res.json())
      .then((data) => {
        setIsPremium(data.isPremium)
        setIsTrial(data.isTrial ?? false)
        setTrialDaysLeft(data.trialDaysLeft ?? 0)
      })
      .catch(() => {
        setIsPremium(false)
        setIsTrial(false)
        setTrialDaysLeft(0)
      })
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
    <SubscriptionContext.Provider value={{ isPremium, isTrial, trialDaysLeft, isLoading, redirectToCheckout, redirectToPortal }}>
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
