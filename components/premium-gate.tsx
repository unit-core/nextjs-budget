'use client'

import { LockIcon, SparklesIcon, ClockIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/use-subscription'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const { isPremium, isTrial, trialDaysLeft, isLoading } = useSubscription()
  const t = useTranslations('Subscription')

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed p-6 opacity-50">
        {children}
      </div>
    )
  }

  if (isPremium && !isTrial) {
    return <>{children}</>
  }

  if (isTrial) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <ClockIcon className="size-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">
            {t('trialActive', { days: trialDaysLeft })}
          </span>
          <Button asChild size="sm" variant="link" className="ms-auto h-auto p-0 text-xs">
            <Link href="/pricing">{t('upgradeToPremium')}</Link>
          </Button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="relative rounded-lg border border-dashed p-6">
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LockIcon className="size-5" />
          <span className="text-sm font-medium">{t('premiumFeature')}</span>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/pricing">
            <SparklesIcon className="size-4" />
            {t('upgradeToPremium')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
