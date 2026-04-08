'use client'

import { LockIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/use-subscription'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const { isPremium, isLoading } = useSubscription()
  const t = useTranslations('Subscription')

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed p-6 opacity-50">
        {children}
      </div>
    )
  }

  if (isPremium) {
    return <>{children}</>
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
