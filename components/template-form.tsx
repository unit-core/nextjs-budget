'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { PlusIcon, TrashIcon, CalendarIcon, CheckIcon, MinusIcon } from 'lucide-react'
import { format } from 'date-fns'
import { RRule, rrulestr } from 'rrule'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'PLN', 'UAH', 'RUB', 'TRY', 'AED', 'SAR'] as const
const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const

// Jan 1 2024 is Monday — use as Intl anchor for locale-aware day/month names
const WEEKDAY_FULL = WEEKDAYS.map((_, i) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(2024, 0, 1 + i))
)
const MONTH_SHORT = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2024, i, 1))
)

type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type EndType = 'never' | 'count' | 'until'

interface RecurrenceState {
  freq: Freq
  interval: number
  // WEEKLY: multi-select days; MONTHLY/YEARLY "onthe": single-element weekday
  byDay: string[]
  // MONTHLY "each": day of month 1–31
  byMonthDay: number
  // MONTHLY/YEARLY "onthe": ordinal position 1–4
  bySetPos: number
  // YEARLY: selected month 1–12
  byMonth: number
  // MONTHLY sub-mode toggle
  monthlyMode: 'each' | 'onthe'
  // YEARLY: whether the "Days of Week" ordinal picker is active
  yearlyByDay: boolean
  endType: EndType
  count: number
  until: Date | null
}

function buildRrule(r: RecurrenceState, dtstart: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0')
  // Floating time at local noon — no Z suffix, local date components.
  // Using getUTC* methods caused DTSTART to land on the previous calendar day
  // when local midnight is earlier than UTC midnight (e.g. UTC+3 at 00:00 = 21:00 UTC prev day).
  const dt = `${dtstart.getFullYear()}${p(dtstart.getMonth() + 1)}${p(dtstart.getDate())}T120000`

  const parts = [`FREQ=${r.freq}`]
  if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`)

  if (r.freq === 'WEEKLY' && r.byDay.length > 0) {
    parts.push(`BYDAY=${r.byDay.join(',')}`)
  }

  if (r.freq === 'MONTHLY') {
    if (r.monthlyMode === 'each') {
      parts.push(`BYMONTHDAY=${r.byMonthDay}`)
    } else {
      parts.push(`BYSETPOS=${r.bySetPos}`)
      parts.push(`BYDAY=${r.byDay[0] ?? 'MO'}`)
    }
  }

  if (r.freq === 'YEARLY') {
    parts.push(`BYMONTH=${r.byMonth}`)
    if (r.yearlyByDay) {
      parts.push(`BYSETPOS=${r.bySetPos}`)
      parts.push(`BYDAY=${r.byDay[0] ?? 'MO'}`)
    }
  }

  if (r.endType === 'count') parts.push(`COUNT=${r.count}`)
  else if (r.endType === 'until' && r.until) {
    const d = r.until
    parts.push(`UNTIL=${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`)
  }

  return `DTSTART:${dt}\nRRULE:${parts.join(';')}`
}

function parseRrule(rrule: string): RecurrenceState {
  const map: Record<string, string> = {}
  const rruleLine = rrule.split('\n').find(l => l.startsWith('RRULE:')) ?? rrule
  for (const part of rruleLine.replace(/^RRULE:/i, '').split(';')) {
    const [k, v] = part.split('=')
    if (k && v !== undefined) map[k.toUpperCase()] = v
  }

  const freq = (map.FREQ || 'MONTHLY') as Freq
  const interval = parseInt(map.INTERVAL || '1') || 1
  const rawByDay = map.BYDAY ? map.BYDAY.split(',') : []
  const bySetPos = parseInt(map.BYSETPOS || '1') || 1
  const byMonth = parseInt(map.BYMONTH || '1') || 1

  let byDay: string[]
  let byMonthDay = 1
  let monthlyMode: 'each' | 'onthe' = 'each'
  let yearlyByDay = false

  if (freq === 'MONTHLY') {
    if (map.BYSETPOS || (rawByDay.length === 1 && !map.BYMONTHDAY)) {
      monthlyMode = 'onthe'
      byDay = rawByDay.length > 0 ? rawByDay : ['MO']
    } else {
      monthlyMode = 'each'
      byDay = []
      byMonthDay = parseInt(map.BYMONTHDAY || '1') || 1
    }
  } else if (freq === 'YEARLY') {
    yearlyByDay = !!(map.BYDAY || map.BYSETPOS)
    byDay = rawByDay.length > 0 ? rawByDay : ['MO']
    byMonthDay = parseInt(map.BYMONTHDAY || '1') || 1
  } else {
    byDay = rawByDay
    byMonthDay = parseInt(map.BYMONTHDAY || '1') || 1
  }

  let endType: EndType = 'never'
  let count = 10
  let until: Date | null = null
  if (map.COUNT) { endType = 'count'; count = parseInt(map.COUNT) || 10 }
  else if (map.UNTIL) {
    endType = 'until'
    const s = map.UNTIL
    until = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`)
  }

  return { freq, interval, byDay, byMonthDay, bySetPos, byMonth, monthlyMode, yearlyByDay, endType, count, until }
}

interface CategoryOption {
  id: string
  name: string
  description: string
  owner_id: string | null
}

interface CategoryGroupOption {
  id: string
  name: string
  owner_id: string | null
  categories: CategoryOption[]
}

interface TemplateItem {
  id?: string
  name: string
  amount: string
  currency_code: string
  transaction_item_category_id: string | null
}

interface TemplateData {
  id?: string
  name: string
  transaction_type: string
  folder_id?: string
  rrule?: string | null
  items: TemplateItem[]
}

function defaultItem(): TemplateItem {
  return { name: '', amount: '', currency_code: 'EUR', transaction_item_category_id: null }
}

function defaultRecurrence(): RecurrenceState {
  return {
    freq: 'MONTHLY',
    interval: 1,
    byDay: ['MO'],
    byMonthDay: 1,
    bySetPos: 1,
    byMonth: new Date().getMonth() + 1,
    monthlyMode: 'each',
    yearlyByDay: false,
    endType: 'never',
    count: 10,
    until: null,
  }
}

export default function TemplateForm({
  initialData,
  onSuccess,
}: {
  initialData?: TemplateData
  onSuccess?: () => void
}) {
  const isEdit = !!initialData?.id
  const t = useTranslations('TemplateForm')
  const tc = useTranslations('Categories')
  const tg = useTranslations('CategoryGroups')
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [transactionType, setTransactionType] = useState(initialData?.transaction_type ?? 'EXPENSE')
  const [items, setItems] = useState<TemplateItem[]>(
    initialData?.items?.length ? initialData.items : [defaultItem()]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupOption[]>([])

  const [isRecurring, setIsRecurring] = useState(!!initialData?.rrule)
  const [recurrence, setRecurrence] = useState<RecurrenceState>(
    initialData?.rrule ? parseRrule(initialData.rrule) : defaultRecurrence()
  )

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('transaction_item_category_groups')
      .select(`
        id,
        name,
        owner_id,
        transaction_item_categories (
          id,
          name,
          description,
          owner_id
        )
      `)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setCategoryGroups(
            data.map((g: any) => ({
              id: g.id,
              name: g.name,
              owner_id: g.owner_id,
              categories: g.transaction_item_categories ?? [],
            }))
          )
        }
      })
  }, [])

  const updateItem = (index: number, field: keyof TemplateItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setItems(prev => [...prev, defaultItem()])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateRecurrence = (patch: Partial<RecurrenceState>) => {
    setRecurrence(prev => ({ ...prev, ...patch }))
  }

  const toggleByDay = (day: string) => {
    setRecurrence(prev => ({
      ...prev,
      byDay: prev.byDay.includes(day)
        ? prev.byDay.filter(d => d !== day)
        : [...prev.byDay, day],
    }))
  }

  const unitLabel = {
    DAILY: t('unitDay'),
    WEEKLY: t('unitWeek'),
    MONTHLY: t('unitMonth'),
    YEARLY: t('unitYear'),
  }[recurrence.freq]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const now = new Date()
    // When editing, preserve the original DTSTART to avoid resetting the recurrence series
    const dtstart = initialData?.rrule
      ? (rrulestr(initialData.rrule) as RRule).options.dtstart ?? now
      : now
    const rruleValue = isRecurring ? buildRrule(recurrence, dtstart) : null
    const nextExecutionAt = rruleValue
      ? (rrulestr(rruleValue) as RRule).after(now)?.toISOString() ?? null
      : null
    const supabase = createClient()

    try {
      if (isEdit) {
        const { error: tmplError } = await supabase
          .from('transaction_templates')
          .update({ name, transaction_type: transactionType, rrule: rruleValue, next_execution_at: nextExecutionAt })
          .eq('id', initialData!.id!)

        if (tmplError) throw tmplError

        const { error: deleteError } = await supabase
          .from('transaction_item_templates')
          .delete()
          .eq('transaction_template_id', initialData!.id!)

        if (deleteError) throw deleteError

        if (items.some(item => item.name.trim())) {
          const { error: itemsError } = await supabase
            .from('transaction_item_templates')
            .insert(
              items
                .filter(item => item.name.trim())
                .map(item => ({
                  transaction_template_id: initialData!.id!,
                  transaction_folder_id: initialData!.folder_id!,
                  name: item.name.trim(),
                  amount: parseFloat(item.amount) || 0,
                  currency_code: item.currency_code,
                  transaction_item_category_id: item.transaction_item_category_id ?? null,
                }))
            )
          if (itemsError) throw itemsError
        }

        toast(t('templateUpdated'), { position: 'top-center' })
      } else {
        const { data: tmpl, error: tmplError } = await supabase
          .from('transaction_templates')
          .insert({ name, transaction_type: transactionType, rrule: rruleValue, next_execution_at: nextExecutionAt })
          .select('id, folder_id')
          .single()

        if (tmplError) throw tmplError

        if (items.some(item => item.name.trim())) {
          const { error: itemsError } = await supabase
            .from('transaction_item_templates')
            .insert(
              items
                .filter(item => item.name.trim())
                .map(item => ({
                  transaction_template_id: tmpl.id,
                  transaction_folder_id: tmpl.folder_id,
                  name: item.name.trim(),
                  amount: parseFloat(item.amount) || 0,
                  currency_code: item.currency_code,
                  transaction_item_category_id: item.transaction_item_category_id ?? null,
                }))
            )
          if (itemsError) throw itemsError
        }

        toast(t('templateCreated'), { position: 'top-center' })
      }

      if (!isEdit) {
        setName('')
        setTransactionType('EXPENSE')
        setItems([defaultItem()])
        setIsRecurring(false)
        setRecurrence(defaultRecurrence())
      }

      onSuccess?.()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="tmpl-name">{t('name')}</Label>
        <Input
          id="tmpl-name"
          placeholder={t('namePlaceholder')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>{t('type')}</Label>
        <Select value={transactionType} onValueChange={setTransactionType}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">{t('expense')}</SelectItem>
            <SelectItem value="INCOME">{t('income')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recurrence */}
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="tmpl-recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(!!checked)}
          />
          <Label htmlFor="tmpl-recurring" className="cursor-pointer">{t('recurring')}</Label>
        </div>

        {isRecurring && (
          <div className="grid gap-3">

            {/* Frequency + Interval card */}
            <div className="rounded-lg border divide-y overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{t('frequency')}</span>
                <Select
                  value={recurrence.freq}
                  onValueChange={(v) => updateRecurrence({ freq: v as Freq })}
                >
                  <SelectTrigger className="w-auto border-0 shadow-none p-0 h-auto gap-1 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">{t('daily')}</SelectItem>
                    <SelectItem value="WEEKLY">{t('weekly')}</SelectItem>
                    <SelectItem value="MONTHLY">{t('monthly')}</SelectItem>
                    <SelectItem value="YEARLY">{t('yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{t('interval')}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateRecurrence({ interval: Math.max(1, recurrence.interval - 1) })}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <MinusIcon className="size-3" />
                  </button>
                  <span className="min-w-4 text-center text-sm tabular-nums">{recurrence.interval}</span>
                  <button
                    type="button"
                    onClick={() => updateRecurrence({ interval: recurrence.interval + 1 })}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <PlusIcon className="size-3" />
                  </button>
                  <span className="text-sm text-destructive w-12">{unitLabel}</span>
                </div>
              </div>
            </div>

            {/* WEEKLY: vertical day list */}
            {recurrence.freq === 'WEEKLY' && (
              <div className="rounded-lg border divide-y overflow-hidden">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleByDay(day)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span>{WEEKDAY_FULL[i]}</span>
                    {recurrence.byDay.includes(day) && (
                      <CheckIcon className="size-4 text-destructive" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* MONTHLY: Each / On the... toggle + details */}
            {recurrence.freq === 'MONTHLY' && (
              <>
                <div className="rounded-lg border divide-y overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateRecurrence({ monthlyMode: 'each' })}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span>{t('each')}</span>
                    {recurrence.monthlyMode === 'each' && (
                      <CheckIcon className="size-4 text-destructive" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRecurrence({ monthlyMode: 'onthe' })}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span>{t('onThe')}</span>
                    {recurrence.monthlyMode === 'onthe' && (
                      <CheckIcon className="size-4 text-destructive" />
                    )}
                  </button>
                </div>

                {recurrence.monthlyMode === 'each' && (
                  <div className="rounded-lg border p-3">
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateRecurrence({ byMonthDay: d })}
                          className={cn(
                            'aspect-square rounded text-sm font-medium transition-colors',
                            recurrence.byMonthDay === d
                              ? 'bg-destructive text-destructive-foreground'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recurrence.monthlyMode === 'onthe' && (
                  <div className="flex gap-2">
                    <Select
                      value={String(recurrence.bySetPos)}
                      onValueChange={(v) => updateRecurrence({ bySetPos: Number(v) })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('ordinal1')}</SelectItem>
                        <SelectItem value="2">{t('ordinal2')}</SelectItem>
                        <SelectItem value="3">{t('ordinal3')}</SelectItem>
                        <SelectItem value="4">{t('ordinal4')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={recurrence.byDay[0] ?? 'MO'}
                      onValueChange={(v) => updateRecurrence({ byDay: [v] })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day, i) => (
                          <SelectItem key={day} value={day}>{WEEKDAY_FULL[i]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {/* YEARLY: month grid + Days of Week toggle */}
            {recurrence.freq === 'YEARLY' && (
              <>
                <div className="rounded-lg border p-3">
                  <div className="grid grid-cols-4 gap-1">
                    {MONTH_SHORT.map((month, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateRecurrence({ byMonth: i + 1 })}
                        className={cn(
                          'rounded py-2 text-sm font-medium transition-colors',
                          recurrence.byMonth === i + 1
                            ? 'bg-destructive text-destructive-foreground'
                            : 'hover:bg-muted text-foreground'
                        )}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border divide-y overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateRecurrence({ yearlyByDay: !recurrence.yearlyByDay })}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span>{t('daysOfWeek')}</span>
                    {/* Minimal toggle pill */}
                    <div className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      recurrence.yearlyByDay ? 'bg-green-500' : 'bg-muted'
                    )}>
                      <div className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        recurrence.yearlyByDay ? 'translate-x-4' : 'translate-x-0.5'
                      )} />
                    </div>
                  </button>

                  {recurrence.yearlyByDay && (
                    <div className="flex gap-2 px-4 py-3">
                      <Select
                        value={String(recurrence.bySetPos)}
                        onValueChange={(v) => updateRecurrence({ bySetPos: Number(v) })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('ordinal1')}</SelectItem>
                          <SelectItem value="2">{t('ordinal2')}</SelectItem>
                          <SelectItem value="3">{t('ordinal3')}</SelectItem>
                          <SelectItem value="4">{t('ordinal4')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={recurrence.byDay[0] ?? 'MO'}
                        onValueChange={(v) => updateRecurrence({ byDay: [v] })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEKDAYS.map((day, i) => (
                            <SelectItem key={day} value={day}>{WEEKDAY_FULL[i]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Ends card */}
            <div className="rounded-lg border divide-y overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{t('ends')}</span>
                <Select
                  value={recurrence.endType}
                  onValueChange={(v) => updateRecurrence({ endType: v as EndType })}
                >
                  <SelectTrigger className="w-auto border-0 shadow-none p-0 h-auto gap-1 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t('endNever')}</SelectItem>
                    <SelectItem value="count">{t('endAfterCount')}</SelectItem>
                    <SelectItem value="until">{t('endOnDate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrence.endType === 'count' && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('occurrences')}</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateRecurrence({ count: Math.max(1, recurrence.count - 1) })}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      <MinusIcon className="size-3" />
                    </button>
                    <span className="min-w-6 text-center text-sm tabular-nums">{recurrence.count}</span>
                    <button
                      type="button"
                      onClick={() => updateRecurrence({ count: recurrence.count + 1 })}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      <PlusIcon className="size-3" />
                    </button>
                  </div>
                </div>
              )}

              {recurrence.endType === 'until' && (
                <div className="px-4 py-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-start font-normal',
                          !recurrence.until && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="size-4" />
                        {recurrence.until ? format(recurrence.until, 'PPP') : t('pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrence.until ?? undefined}
                        onSelect={(day) => updateRecurrence({ until: day ?? null })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>{t('items')}</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>
            <PlusIcon className="size-4" />
            {t('addItem')}
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border p-3">
            <div className="grid gap-1.5">
              <Input
                placeholder={t('itemNamePlaceholder')}
                required
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
              />
              <Select
                value={item.transaction_item_category_id ?? ''}
                onValueChange={(v) => updateItem(index, 'transaction_item_category_id', v || null as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('selectCategory')}>
                    {(() => {
                      const cat = item.transaction_item_category_id
                        ? categoryGroups.flatMap((g) => g.categories).find((c) => c.id === item.transaction_item_category_id)
                        : null
                      if (!cat) return t('selectCategory')
                      const nameKey = `${cat.name}.name` as Parameters<typeof tc>[0]
                      return tc.has(nameKey) ? tc(nameKey) : cat.name
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categoryGroups.map((group) => (
                    <SelectGroup key={group.id}>
                      <SelectLabel className="flex items-center gap-1.5">
                        {(() => {
                          const gNameKey = `${group.name}.name` as Parameters<typeof tg>[0]
                          return tg.has(gNameKey) ? tg(gNameKey) : group.name
                        })()}
                        {group.owner_id === null && (
                          <span className="text-[10px] font-normal text-muted-foreground">{t('systemLabel')}</span>
                        )}
                      </SelectLabel>
                      {group.categories.map((cat) => {
                        const cNameKey = `${cat.name}.name` as Parameters<typeof tc>[0]
                        const cDescKey = `${cat.name}.description` as Parameters<typeof tc>[0]
                        const catName = tc.has(cNameKey) ? tc(cNameKey) : cat.name
                        const catDesc = tc.has(cDescKey) ? tc(cDescKey) : cat.description
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex flex-col items-start py-0.5">
                              <span className="font-medium">{catName}</span>
                              {catDesc && (
                                <span className="text-xs text-muted-foreground">{catDesc}</span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                value={item.amount}
                onChange={(e) => updateItem(index, 'amount', e.target.value)}
              />
              <Select
                value={item.currency_code}
                onValueChange={(v) => updateItem(index, 'currency_code', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit text-destructive"
                onClick={() => removeItem(index)}
              >
                <TrashIcon className="size-3.5" />
                {t('removeItem')}
              </Button>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner /> : null}
        {isLoading
          ? t('saving')
          : isEdit
            ? t('update')
            : t('create')
        }
      </Button>
    </form>
  )
}
