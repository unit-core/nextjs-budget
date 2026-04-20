'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { PlusIcon, TrashIcon, CalendarIcon } from 'lucide-react'
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

type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type EndType = 'never' | 'count' | 'until'

interface RecurrenceState {
  freq: Freq
  interval: number
  byDay: string[]
  byMonthDay: number
  endType: EndType
  count: number
  until: Date | null
}

function buildRrule(r: RecurrenceState, dtstart: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0')
  const dt = `${dtstart.getUTCFullYear()}${p(dtstart.getUTCMonth() + 1)}${p(dtstart.getUTCDate())}T${p(dtstart.getUTCHours())}${p(dtstart.getUTCMinutes())}${p(dtstart.getUTCSeconds())}Z`
  const parts = [`FREQ=${r.freq}`]
  if (r.interval > 1) parts.push(`INTERVAL=${r.interval}`)
  if (r.freq === 'WEEKLY' && r.byDay.length > 0) parts.push(`BYDAY=${r.byDay.join(',')}`)
  if (r.freq === 'MONTHLY') parts.push(`BYMONTHDAY=${r.byMonthDay}`)
  if (r.endType === 'count') parts.push(`COUNT=${r.count}`)
  else if (r.endType === 'until' && r.until) {
    const d = r.until
    parts.push(`UNTIL=${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`)
  }
  return `DTSTART:${dt}\nRRULE:${parts.join(';')}`
}

function parseRrule(rrule: string): RecurrenceState {
  const map: Record<string, string> = {}
  // берём только строку RRULE, игнорируем DTSTART
  const rruleLine = rrule.split('\n').find(l => l.startsWith('RRULE:')) ?? rrule
  for (const part of rruleLine.replace(/^RRULE:/i, '').split(';')) {
    const [k, v] = part.split('=')
    if (k && v !== undefined) map[k.toUpperCase()] = v
  }
  const freq = (map.FREQ || 'MONTHLY') as Freq
  const interval = parseInt(map.INTERVAL || '1') || 1
  const byDay = map.BYDAY ? map.BYDAY.split(',') : []
  const byMonthDay = parseInt(map.BYMONTHDAY || '1') || 1
  let endType: EndType = 'never'
  let count = 10
  let until: Date | null = null
  if (map.COUNT) { endType = 'count'; count = parseInt(map.COUNT) || 10 }
  else if (map.UNTIL) {
    endType = 'until'
    const s = map.UNTIL
    until = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`)
  }
  return { freq, interval, byDay, byMonthDay, endType, count, until }
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
  return { freq: 'MONTHLY', interval: 1, byDay: [], byMonthDay: 1, endType: 'never', count: 10, until: null }
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
      byDay: prev.byDay.includes(day) ? prev.byDay.filter(d => d !== day) : [...prev.byDay, day],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const now = new Date()
    // при редактировании сохраняем оригинальный DTSTART чтобы не сбросить отсчёт
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
          <div className="grid gap-3 rounded-lg border p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t('frequency')}</Label>
                <Select value={recurrence.freq} onValueChange={(v) => updateRecurrence({ freq: v as Freq })}>
                  <SelectTrigger className="w-full">
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
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t('interval')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={recurrence.interval}
                  onChange={(e) => updateRecurrence({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
                />
              </div>
            </div>

            {recurrence.freq === 'WEEKLY' && (
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t('onDays')}</Label>
                <div className="flex gap-1">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleByDay(day)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors',
                        recurrence.byDay.includes(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {t(`day${day}` as any)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recurrence.freq === 'MONTHLY' && (
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">{t('onDayOfMonth')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={recurrence.byMonthDay}
                  onChange={(e) => updateRecurrence({ byMonthDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">{t('ends')}</Label>
              <Select value={recurrence.endType} onValueChange={(v) => updateRecurrence({ endType: v as EndType })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{t('endNever')}</SelectItem>
                  <SelectItem value="count">{t('endAfterCount')}</SelectItem>
                  <SelectItem value="until">{t('endOnDate')}</SelectItem>
                </SelectContent>
              </Select>

              {recurrence.endType === 'count' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={recurrence.count}
                    onChange={(e) => updateRecurrence({ count: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('occurrences')}</span>
                </div>
              )}

              {recurrence.endType === 'until' && (
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
                  <SelectValue placeholder="Select category">
                    {(() => {
                      const cat = item.transaction_item_category_id
                        ? categoryGroups.flatMap((g) => g.categories).find((c) => c.id === item.transaction_item_category_id)
                        : null
                      if (!cat) return 'Select category'
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
                          <span className="text-[10px] font-normal text-muted-foreground">(system)</span>
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
