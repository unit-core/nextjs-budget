import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      // Subscription created successfully.
      // Stripe Sync Engine automatically syncs subscription data to Supabase.
      console.log('Checkout session completed:', event.data.object.id)
      break
    }
    case 'invoice.paid': {
      // Recurring payment succeeded — access continues.
      console.log('Invoice paid:', event.data.object.id)
      break
    }
    case 'invoice.payment_failed': {
      // Payment failed — subscription becomes past_due.
      console.log('Invoice payment failed:', event.data.object.id)
      break
    }
    case 'customer.subscription.updated': {
      console.log('Subscription updated:', event.data.object.id)
      break
    }
    case 'customer.subscription.deleted': {
      // Subscription cancelled — revoke access.
      console.log('Subscription deleted:', event.data.object.id)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
