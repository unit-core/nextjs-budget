import { createClient } from '@/lib/supabase/server'

/**
 * Checks if the current user has an active Stripe subscription.
 * Uses the Stripe Sync Engine tables in the `stripe` schema.
 */
export async function checkSubscription(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return false

  // Query stripe.subscriptions via stripe.customers using email match.
  // Stripe Sync Engine syncs these tables automatically.
  const { data, error } = await supabase
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

  if (error) {
    // If Stripe Sync Engine tables don't exist yet, fall back to API route
    console.error('Error checking subscription:', error.message)
    return false
  }

  return (data?.length ?? 0) > 0
}
