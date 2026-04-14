/* eslint-disable no-console */
import { mkdir } from "node:fs/promises"
import { chromium } from "@playwright/test"

import { locales, localeDirection } from "../../i18n/config"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = "public/images/screenshots"
const URL_PATH = "/preview/dashboard"

// 4K UHD output (3840x2160). Viewport 1920x1080 at 2x device scale.
const VIEWPORT = { width: 1920, height: 1080 }
const DEVICE_SCALE = 2

const THEMES = ["light", "dark"] as const
type Theme = (typeof THEMES)[number]

// Output filename: light keeps the legacy name; dark gets a -dark suffix.
function outPath(locale: string, theme: Theme) {
  const suffix = theme === "dark" ? "-dark" : ""
  return `${OUT}/project-app-screenshot-${locale}${suffix}.png`
}

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()

try {
  for (const locale of locales) {
    for (const theme of THEMES) {
      const ctx = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: DEVICE_SCALE,
        locale,
        // Drives prefers-color-scheme; next-themes (defaultTheme="system") picks this up.
        colorScheme: theme,
      })

      const host = new URL(BASE).hostname
      await ctx.addCookies([
        { name: "locale", value: locale, domain: host, path: "/" },
        { name: "direction", value: localeDirection[locale], domain: host, path: "/" },
      ])

      const page = await ctx.newPage()

      // Belt-and-suspenders: seed next-themes' localStorage BEFORE any app script runs,
      // so the initial paint matches the requested theme even if a user later flips
      // defaultTheme away from "system".
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t)
        } catch {}
        // Also disable animations so charts/rows don't fade in mid-capture.
        const style = document.createElement("style")
        style.textContent =
          "*,*::before,*::after{animation:none!important;transition:none!important}"
        document.documentElement.appendChild(style)
      }, theme)

      const url = `${BASE}${URL_PATH}`
      const res = await page.goto(url, { waitUntil: "networkidle" })
      if (!res || !res.ok()) {
        throw new Error(
          `Navigation to ${url} failed with status ${res?.status()}. ` +
            `Did you start the dev server with ENABLE_PREVIEW_ROUTES=1?`,
        )
      }

      // Verify the theme actually applied — catches regressions where next-themes
      // silently falls back and produces a wrong-theme PNG.
      const htmlClass = await page.evaluate(() => document.documentElement.className)
      const hasDark = htmlClass.split(/\s+/).includes("dark")
      if (theme === "dark" && !hasDark) throw new Error(`Dark theme not applied for ${locale}`)
      if (theme === "light" && hasDark) throw new Error(`Light theme not applied for ${locale}`)

      // Recharts renders after mount; give it a tick to settle.
      await page.waitForTimeout(500)

      await page.screenshot({
        path: outPath(locale, theme),
        clip: { x: 0, y: 0, ...VIEWPORT },
      })

      await ctx.close()
      console.log(`✓ ${locale} ${theme}`)
    }
  }
} finally {
  await browser.close()
}
