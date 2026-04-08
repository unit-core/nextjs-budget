import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const PRICE_IDS: Record<string, string | undefined> = {
  weekly: process.env.STRIPE_WEEKLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const plan = body.plan as string

  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json(
      { error: 'Invalid plan. Use "weekly" or "yearly".' },
      { status: 400 }
    )
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID not configured for plan: ${plan}. Set STRIPE_${plan.toUpperCase()}_PRICE_ID in env.` },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find or create Stripe customer by email
  const customers = await stripe.customers.list({
    email: user.email,
    limit: 1,
  })

  let customerId: string
  if (customers.data.length > 0) {
    customerId = customers.data[0].id
  } else {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/pricing`,
  })

  return NextResponse.json({ url: session.url })
}
