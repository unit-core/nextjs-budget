import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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

  // Always allow auth routes, root landing page, and public pricing page
  if (pathname.startsWith("/auth") || pathname === "/" || pathname.startsWith("/pricing")) {
    return supabaseResponse;
  }

  // Not signed in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Signed in + accessing /protected → check subscription
  if (pathname.startsWith("/protected")) {
    const hasSubscription = await checkActiveSubscription(user.sub);
    if (!hasSubscription) {
      const url = request.nextUrl.clone();
      url.pathname = "/pricing";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

async function checkActiveSubscription(userId: string): Promise<boolean> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.stripe_customer_id) return false;

  const { data: subscription } = await (admin.schema("stripe") as any)
    .from("subscriptions")
    .select("status")
    .eq("customer", profile.stripe_customer_id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  return !!subscription;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
