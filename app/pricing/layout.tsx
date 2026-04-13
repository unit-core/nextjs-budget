import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — Weekly & Yearly Plans",
  description:
    "Choose the right budget tracker plan for you. Start free with manual tracking, or unlock premium features like receipt scanning, smart text input, and 40+ auto-detected categories from just \u20AC1/week.",
  alternates: {
    canonical: "https://budget.unitcore.io/pricing",
  },
  openGraph: {
    title: "Pricing — UnitCore Budget Plans",
    description:
      "Unlock premium budget tracking features from \u20AC1/week or \u20AC40/year. Receipt scanning, smart text input, and 40+ categories.",
    url: "https://budget.unitcore.io/pricing",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
