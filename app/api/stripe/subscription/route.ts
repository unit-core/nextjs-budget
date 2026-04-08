import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ isPremium: false })
  }

  // First, try Stripe Sync Engine tables
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
    return NextResponse.json({ isPremium: true })
  }

  // Fallback: query Stripe API directly
  try {
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json({ isPremium: false })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    })

    return NextResponse.json({
      isPremium: subscriptions.data.length > 0,
    })
  } catch {
    return NextResponse.json({ isPremium: false })
  }
}
