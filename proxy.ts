import { type NextRequest } from 'next/server'
import Negotiator from 'negotiator'
import { match } from '@formatjs/intl-localematcher'

import { updateSession } from '@/lib/supabase/middleware'
import { locales, defaultLocale, localeDirection, type Locale } from '@/i18n/config'

function resolveLocale(request: NextRequest): Locale {
  const headers = {
    'accept-language': request.headers.get('accept-language') ?? '',
  }
  const requested = new Negotiator({ headers }).languages()
  try {
    return match(requested, locales as readonly string[], defaultLocale) as Locale
  } catch {
    return defaultLocale
  }
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  if (!request.cookies.get('locale')) {
    const locale = resolveLocale(request)
    const cookieOptions = {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax' as const,
    }
    response.cookies.set('locale', locale, cookieOptions)
    response.cookies.set('direction', localeDirection[locale], cookieOptions)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
