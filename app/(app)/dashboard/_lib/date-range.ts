export interface DateRange {
  start: Date
  end: Date
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
