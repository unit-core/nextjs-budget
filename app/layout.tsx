import { Geist, Geist_Mono, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/direction-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { getDirection } from "@/i18n/actions"
import { SubscriptionProvider } from "@/hooks/use-subscription"

const BASE_URL = "https://budget.unitcore.io"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "UnitCore Budget — Free Expense Tracker & Budget Planner",
    template: "%s | UnitCore Budget",
  },
  description:
    "Track every expense, manage budgets, and understand your spending patterns. Free budget tracker app with smart analytics, multi-currency support, and 40+ categories. Available in English, Arabic & Russian.",
  keywords: [
    "budget tracker",
    "expense tracker",
    "budget app",
    "money management",
    "personal finance",
    "spending tracker",
    "budget planner",
    "free budget app",
    "multi-currency budget",
    "expense categories",
  ],
  authors: [{ name: "Denis Popov" }],
  creator: "UnitCore",
  publisher: "UnitCore",
  alternates: {
    canonical: BASE_URL,
    languages: {
      en: BASE_URL,
      ar: BASE_URL,
      ru: BASE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_SA", "ru_RU"],
    url: BASE_URL,
    siteName: "UnitCore Budget",
    title: "UnitCore Budget — Free Expense Tracker & Budget Planner",
    description:
      "Track every expense, manage budgets, and understand your spending patterns. Free budget tracker with smart analytics and multi-currency support.",
    images: [
      {
        url: "/images/screenshots/project-app-screenshot-en.png",
        width: 2432,
        height: 1442,
        alt: "UnitCore Budget Tracker Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UnitCore Budget — Free Expense Tracker & Budget Planner",
    description:
      "Track every expense, manage budgets, and understand your spending patterns. Free budget tracker with smart analytics and multi-currency support.",
    images: ["/images/screenshots/project-app-screenshot-en.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const direction = await getDirection()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DirectionProvider direction={direction}>
            <ThemeProvider>
              <TooltipProvider>
                <SubscriptionProvider>
                  {children}
                </SubscriptionProvider>
              </TooltipProvider>
            </ThemeProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
