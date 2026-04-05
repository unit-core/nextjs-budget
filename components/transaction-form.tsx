'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { PlusIcon, TrashIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from './ui/scroll-area'

const CATEGORIES = [
  'RENT', 'MORTGAGE', 'UTILITIES', 'INTERNET', 'HOUSEHOLD',
  'GROCERIES', 'RESTAURANTS', 'DELIVERY', 'PUBLIC_TRANSPORT', 'TAXI',
  'FUEL', 'CAR_SERVICE', 'PARKING', 'MEDICAL', 'PHARMACY',
  'PERSONAL_CARE', 'SPORT', 'SUBSCRIPTIONS', 'HOBBIES', 'EVENTS',
  'TRAVEL', 'CLOTHING', 'ELECTRONICS', 'PETS', 'EDUCATION',
  'BOOKS', 'TAXES', 'INSURANCE', 'LOANS', 'BANK_FEES',
  'SALARY', 'FREELANCE', 'INVESTMENTS', 'RENTAL_INCOME', 'CASHBACK',
  'GIFTS', 'SALES', 'BUSINESS_EXPENSES', 'SOFTWARE_LICENSES',
  'HOME_IMPROVEMENT', 'SAVINGS', 'REFUNDS', 'FINES', 'CHARITY', 'UNKNOWN',
] as const

const CURRENCIES = ['EUR', 'USD', 'GBP', 'PLN', 'UAH', 'RUB', 'TRY', 'AED', 'SAR'] as const

interface TransactionItem {
  id?: string
  name: string
  amount: string
  currency_code: string
  category: string
}

interface TransactionData {
  id?: string
  name: string
  transaction_type: string
  executed_at: string
  status: string
  folder_id?: string
  items: TransactionItem[]
}

function defaultItem(): TransactionItem {
  return { name: '', amount: '', currency_code: 'EUR', category: 'UNKNOWN' }
}

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

export default function TransactionForm({
  initialData,
  onSuccess,
}: {
  initialData?: TransactionData
  onSuccess?: () => void
}) {
  const isEdit = !!initialData?.id
  const t = useTranslations('TransactionForm')
  const tc = useTranslations('Categories')
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [transactionType, setTransactionType] = useState(initialData?.transaction_type ?? 'EXPENSE')
  const [executedAt, setExecutedAt] = useState(
    initialData?.executed_at
      ? toDateInputValue(new Date(initialData.executed_at))
      : toDateInputValue(new Date())
  )
  const [items, setItems] = useState<TransactionItem[]>(
    initialData?.items?.length ? initialData.items : [defaultItem()]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateItem = (index: number, field: keyof TransactionItem, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setItems(prev => [...prev, defaultItem()])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (isEdit) {
        // Update transaction
        const { error: txError } = await supabase
          .from('transactions')
          .update({
            name,
            transaction_type: transactionType,
            executed_at: new Date(executedAt).toISOString(),
          })
          .eq('id', initialData!.id!)

        if (txError) throw txError

        // Delete existing items and re-insert
        const { error: deleteError } = await supabase
          .from('transaction_items')
          .delete()
          .eq('transaction_id', initialData!.id!)

        if (deleteError) throw deleteError

        if (items.some(item => item.name.trim())) {
          const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(
              items
                .filter(item => item.name.trim())
                .map(item => ({
                  transaction_id: initialData!.id!,
                  transaction_folder_id: initialData!.folder_id!,
                  name: item.name.trim(),
                  amount: parseFloat(item.amount) || 0,
                  currency_code: item.currency_code,
                  category: item.category,
                  executed_at: new Date(executedAt).toISOString(),
                }))
            )
          if (itemsError) throw itemsError
        }

        toast(t('transactionUpdated'), { position: 'top-center' })
      } else {
        // Create transaction
        const { data: tx, error: txError } = await supabase
          .from('transactions')
          .insert({
            name,
            transaction_type: transactionType,
            executed_at: new Date(executedAt).toISOString(),
            status: 'CONFIRMED',
            source: null,
          })
          .select('id, folder_id')
          .single()

        if (txError) throw txError

        if (items.some(item => item.name.trim())) {
          const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(
              items
                .filter(item => item.name.trim())
                .map(item => ({
                  transaction_id: tx.id,
                  transaction_folder_id: tx.folder_id,
                  name: item.name.trim(),
                  amount: parseFloat(item.amount) || 0,
                  currency_code: item.currency_code,
                  category: item.category,
                  executed_at: new Date(executedAt).toISOString(),
                }))
            )
          if (itemsError) throw itemsError
        }

        toast(t('transactionCreated'), { position: 'top-center' })
      }

      // Reset form on create
      if (!isEdit) {
        setName('')
        setTransactionType('EXPENSE')
        setExecutedAt(toDateInputValue(new Date()))
        setItems([defaultItem()])
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
    <ScrollArea>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Transaction name */}
        <div className="grid gap-1.5">
            <Label htmlFor="tx-name">{t('name')}</Label>
            <Input
            id="tx-name"
            placeholder={t('namePlaceholder')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            />
        </div>

        {/* Type + Date row */}
        {/* <div className="grid grid-cols-2 gap-3"> */}
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
            <div className="grid gap-1.5">
            <Label htmlFor="tx-date">{t('date')}</Label>
            <Input
                id="tx-date"
                type="datetime-local"
                required
                value={executedAt}
                onChange={(e) => setExecutedAt(e.target.value)}
            />
            </div>
        {/* </div> */}

        {/* Items */}
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
                    value={item.category}
                    onValueChange={(v) => updateItem(index, 'category', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue>
                        {/* This renders only the name in the trigger when a value is selected */}
                        {item.category ? tc(`${item.category}.name`) : tc('placeholder_text')}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                            <div className="flex flex-col items-start p-2">
                                <span className="font-semibold">{tc(`${cat}.name`)}</span>
                                <span className="text-xs text-muted-foreground">{tc(`${cat}.description`)}</span>
                            </div>
                        </SelectItem>
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
    </ScrollArea>
  )
}
