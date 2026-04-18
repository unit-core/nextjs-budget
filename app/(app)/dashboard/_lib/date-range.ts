export interface DateRange {
  start: Date
  end: Date
}

export function parseMonthParam(param: string | null | undefined): Date {
  if (param) {
    const match = param.match(/^(\d{4})-(\d{2})$/)
    if (match) {
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      if (month >= 0 && month <= 11) return new Date(year, month, 1)
    }
  }
  return new Date()
}

export function toMonthParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getMonthRange(date: Date): DateRange {
  const year = date.getFullYear()
  const month = date.getMonth()
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999),
  }
}

export function isWithinRange(value: string | Date, { start, end }: DateRange): boolean {
  const date = value instanceof Date ? value : new Date(value)
  return date >= start && date <= end
}

export function isSameDay(value: string | Date, other: Date): boolean {
  const date = value instanceof Date ? value : new Date(value)
  return date.toDateString() === other.toDateString()
}
