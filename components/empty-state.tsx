"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import TextareaAutosize from "react-textarea-autosize"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import {
  PenLineIcon as Step1Icon,
  WalletIcon,
  ChartNoAxesCombinedIcon,
  ClockIcon,
  CameraIcon,
  TypeIcon,
  PenLineIcon,
} from "lucide-react"
import TransactionForm from "@/components/transaction-form"
import { FileUploadDemo } from "@/components/file-upload"
import { PremiumGate } from "@/components/premium-gate"
import { createClient } from "@/lib/supabase/client"
import type { SidebarUser } from "@/components/app-sidebar"

function TextInput() {
  const [text, setText] = useState("")
  const [isLoading, setLoading] = useState(false)
  const router = useRouter()

  const saveNewTransaction = async () => {
    if (!text.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("transactions")
      .insert({
        source: {
          source_type: "text",
          source: { text: text.trim() },
        },
      })
    setLoading(false)
    if (!error) {
      toast("Transaction has been created", {
        position: "top-center",
        description: "The system is already processing",
      })
      setText("")
      router.refresh()
    }
  }

  return (
    <div className="grid w-full gap-6">
      <InputGroup>
        <TextareaAutosize
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-slot="input-group-control"
          className="flex field-sizing-content min-h-24 max-h-80 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
          placeholder="Just type what you spent...."
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            className="ml-auto"
            size="sm"
            variant="default"
            onClick={saveNewTransaction}
            disabled={!text.trim() || isLoading}
          >
            {isLoading ? <Spinner /> : null}
            Submit
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

export function EmptyState({ user }: { user: SidebarUser }) {
  const t = useTranslations("EmptyState")

  const steps = [
    { icon: Step1Icon, titleKey: "step1Title", descKey: "step1Desc" },
    { icon: ClockIcon, titleKey: "step2Title", descKey: "step2Desc" },
    { icon: ChartNoAxesCombinedIcon, titleKey: "step3Title", descKey: "step3Desc" },
  ] as const

  return (
    <div className="flex flex-col gap-8 px-4 py-8 md:py-12 lg:px-6">
      {/* Hero */}
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <WalletIcon className="size-7 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* How it works - 3 steps */}
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {steps.map((step, i) => (
          <Card key={i} className="relative overflow-hidden border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <step.icon className="size-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {t("stepLabel", { number: i + 1 })}
                </span>
              </div>
              <CardTitle className="text-sm">{t(step.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t(step.descKey)}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed transaction creation */}
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>{t("formTitle")}</CardTitle>
          <CardDescription>{t("formDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1 gap-1.5">
                <PenLineIcon className="size-3.5" />
                {t("tabManual")}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex-1 gap-1.5">
                <CameraIcon className="size-3.5" />
                {t("tabImage")}
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-1.5">
                <TypeIcon className="size-3.5" />
                {t("tabText")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <TransactionForm />
            </TabsContent>
            <TabsContent value="image">
              <PremiumGate>
                <FileUploadDemo user={user} />
              </PremiumGate>
            </TabsContent>
            <TabsContent value="text">
              <PremiumGate>
                <TextInput />
              </PremiumGate>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
