import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TRIAL_DAYS = 30

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isPremium: false, isTrial: false, trialDaysLeft: 0 })
    }

    // Try Stripe Sync Engine tables first
    const { data: syncData, error: syncError } = await supabase
      .from('stripe_subscriptions')
      .select(`
        id,
        status,
        stripe_customers!inner (
          email
        )
      `)
      .eq('stripe_customers.email', user.email)
      .in('status', ['active', 'trialing'])
      .limit(1)

    if (!syncError && syncData && syncData.length > 0) {
      return NextResponse.json({ isPremium: true, isTrial: false, trialDaysLeft: 0 })
    }

    // Fallback: query Stripe API directly
    try {
      const { stripe } = await import('@/lib/stripe')
      const customers = await stripe.customers.list({
        email: user.email!,
        limit: 1,
      })

      if (customers.data.length > 0) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          limit: 1,
        })

        const activeSub = subscriptions.data.find(
          (s) => s.status === 'active' || s.status === 'trialing'
        )

        if (activeSub) {
          return NextResponse.json({ isPremium: true, isTrial: false, trialDaysLeft: 0 })
        }
      }
    } catch {
      // Stripe unavailable — fall through to trial check
    }

    // No active subscription — check registration-based free trial
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const daysSinceRegistration = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const trialDaysLeft = Math.max(0, TRIAL_DAYS - daysSinceRegistration)
    const isTrial = trialDaysLeft > 0

    return NextResponse.json({
      isPremium: isTrial,
      isTrial,
      trialDaysLeft,
    })
  } catch {
    return NextResponse.json({ isPremium: false, isTrial: false, trialDaysLeft: 0 })
  }
}
