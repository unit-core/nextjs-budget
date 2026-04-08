'use client'

import { CheckIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type PlanKey = 'weekly' | 'yearly'

export default function PricingPage() {
  const router = useRouter()
  const { isPremium, isLoading: isSubLoading, redirectToPortal } = useSubscription()
  const t = useTranslations('Pricing')
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)

  const handleCheckout = async (plan: PlanKey) => {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  const tiers = [
    {
      key: 'weekly' as PlanKey,
      name: t('weeklyName'),
      price: '€1',
      period: t('perWeek'),
      description: t('weeklyDescription'),
      features: [
        t('featureImageUpload'),
        t('featureTextInput'),
        t('featureAllCategories'),
        t('featureBasicSupport'),
      ],
      featured: false,
    },
    {
      key: 'yearly' as PlanKey,
      name: t('yearlyName'),
      price: '€40',
      period: t('perYear'),
      description: t('yearlyDescription'),
      badge: t('savePercent'),
      features: [
        t('featureImageUpload'),
        t('featureTextInput'),
        t('featureAllCategories'),
        t('featurePrioritySupport'),
        t('featureEarlyAccess'),
      ],
      featured: true,
    },
  ]

  return (
    <div className="relative isolate bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 dark:opacity-20"
        />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base/7 font-semibold text-primary">
          {t('title')}
        </h2>
        <p className="mt-2 text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          {t('headline')}
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-muted-foreground sm:text-xl/8">
        {t('subtitle')}
      </p>

      {/* Already premium */}
      {!isSubLoading && isPremium && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <p className="font-medium text-green-700 dark:text-green-400">
              {t('alreadyPremium')}
            </p>
            <button
              onClick={redirectToPortal}
              className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('manageSubscription')}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.key}
            className={cn(
              'rounded-3xl p-8 ring-1 sm:p-10',
              tier.featured
                ? 'relative bg-foreground/[0.03] shadow-2xl ring-foreground/10 dark:bg-white/5 dark:ring-white/10'
                : 'bg-background/60 ring-border sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-bl-3xl lg:rounded-tr-none'
                  : 'sm:rounded-t-none lg:rounded-bl-none lg:rounded-tr-3xl',
            )}
          >
            <div className="flex items-center justify-between">
              <h3
                className={cn(
                  'text-base/7 font-semibold',
                  tier.featured ? 'text-primary' : 'text-primary',
                )}
              >
                {tier.name}
              </h3>
              {tier.badge && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {tier.badge}
                </span>
              )}
            </div>

            <p className="mt-4 flex items-baseline gap-x-2">
              <span className="text-5xl font-semibold tracking-tight text-foreground">
                {tier.price}
              </span>
              <span className="text-base text-muted-foreground">
                {tier.period}
              </span>
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {t('plusTax')}
            </p>

            <p className="mt-6 text-base/7 text-muted-foreground">
              {tier.description}
            </p>

            <ul className="mt-8 space-y-3 text-sm/6 text-muted-foreground sm:mt-10">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    aria-hidden="true"
                    className="h-6 w-5 flex-none text-primary"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                if (isPremium) {
                  redirectToPortal()
                } else {
                  handleCheckout(tier.key)
                }
              }}
              disabled={loadingPlan !== null || isSubLoading}
              className={cn(
                'mt-8 block w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10 disabled:opacity-50',
                tier.featured
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-primary'
                  : 'bg-secondary text-secondary-foreground ring-1 ring-border hover:bg-secondary/80 focus-visible:outline-primary',
              )}
            >
              {loadingPlan === tier.key
                ? t('redirecting')
                : isPremium
                  ? t('manageSubscription')
                  : t('getStarted')}
            </button>
          </div>
        ))}
      </div>

      {/* Free tier info */}
      <div className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-sm text-muted-foreground">
          {t('freeIncluded')}
        </p>
      </div>

      {/* Back to dashboard */}
      <div className="mx-auto mt-6 text-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('backToDashboard')}
        </button>
      </div>
    </div>
  )
}
