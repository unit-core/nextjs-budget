import { Geist, Geist_Mono, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/direction-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { getDirection } from "@/i18n/actions"
import { SubscriptionProvider } from "@/hooks/use-subscription"


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
