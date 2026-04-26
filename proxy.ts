import { createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "@/lib/utils";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Must call getClaims() immediately — do not add code between createServerClient and this.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/auth");
  const isPricing = pathname.startsWith("/pricing");
  const isPublic = pathname === "/" || isAuthRoute || isPricing;

  // Signed in + has subscription → always go to /protected
  if (user && isPublic) {
    const hasSubscription = await checkActiveSubscription(supabase, user.sub);
    if (hasSubscription) {
      const url = request.nextUrl.clone();
      url.pathname = "/protected";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Not signed in on a public route → allow through
  if (!user && isPublic) {
    return supabaseResponse;
  }

  // Not signed in on a protected route → login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Signed in + accessing /protected → check subscription
  if (pathname.startsWith("/protected")) {
    const hasSubscription = await checkActiveSubscription(supabase, user.sub);
    if (!hasSubscription) {
      const url = request.nextUrl.clone();
      url.pathname = "/pricing";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

async function checkActiveSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  console.log(`[subscription] checking for user ${userId}`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error(`[subscription] failed to fetch profile:`, profileError.message);
    return false;
  }

  if (!profile?.stripe_customer_id) {
    console.log(`[subscription] no stripe_customer_id found for user ${userId} → redirect to pricing`);
    return false;
  }

  console.log(`[subscription] found customer ${profile.stripe_customer_id}, checking stripe.subscriptions...`);

  const { data: hasSubscription, error: subError } = await supabase
    .rpc("has_active_subscription", { customer_id: profile.stripe_customer_id });

  if (subError) {
    console.error(`[subscription] failed to query stripe.subscriptions:`, subError.message);
    return false;
  }

  if (!hasSubscription) {
    console.log(`[subscription] no active/trialing subscription for customer ${profile.stripe_customer_id} → redirect to pricing`);
    return false;
  }

  console.log(`[subscription] active subscription found → allow access`);
  return true;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
