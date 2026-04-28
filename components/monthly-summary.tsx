import { Badge } from "@/components/ui/badge"

const MONTHS = [
  { label: "March", spent: 2_870.0 },
  { label: "April", spent: 3_240.5 },
]

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function MonthlySummary() {
  return (
    <div className="flex gap-2">
      {MONTHS.map(({ label, spent }) => (
        <Badge
          key={label}
          variant="secondary"
          className="px-3 py-1.5 text-sm font-normal gap-1.5 rounded-full"
        >
          <span className="text-muted-foreground text-xs">{label}</span>
          <span className="font-medium tabular-nums">{formatAmount(spent)}</span>
        </Badge>
      ))}
    </div>
  )
}
