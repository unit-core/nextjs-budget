import { LanguagePicker } from "@/components/language-picker"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="absolute top-4 end-4 z-10">
        <LanguagePicker />
      </div>
      {children}
    </div>
  )
}
