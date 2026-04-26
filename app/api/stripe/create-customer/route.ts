import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return existing customer ID if already created
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.stripe_customer_id) {
    return NextResponse.json({ customerId: profile.stripe_customer_id });
  }

  const customer = await stripe.customers.create({
    email: user.email!,
    metadata: { supabase_user_id: user.id },
  });

  await supabase
    .from("profiles")
    .upsert({ id: user.id, stripe_customer_id: customer.id });

  return NextResponse.json({ customerId: customer.id });
}
