"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import {
  EllipsisVerticalIcon,
  LogOutIcon,
  LanguagesIcon,
  PilcrowLeftIcon,
  CheckIcon,
  SparklesIcon,
  CreditCardIcon,
  ClockIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useTransition } from "react"
import { setLocale, setDirection } from "@/i18n/actions"
import { locales, localeNames, type Locale } from "@/i18n/config"
import { useSubscription } from "@/hooks/use-subscription"

export function NavUser({
  user,
  direction,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  direction: "ltr" | "rtl"
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("Settings")
  const [isPending, startTransition] = useTransition()
  const { isPremium, isTrial, trialDaysLeft, isLoading: isSubLoading, redirectToPortal } = useSubscription()
  const tSub = useTranslations("Subscription")

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  function handleLocaleChange(newLocale: Locale) {
    startTransition(async () => {
      await setLocale(newLocale)
      router.refresh()
    })
  }

  function handleDirectionChange(dir: "ltr" | "rtl") {
    startTransition(async () => {
      await setDirection(dir)
      router.refresh()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : direction === "rtl" ? "left" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* Language Picker */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LanguagesIcon className="me-2 size-4" />
                  {t("language")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {locales.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      disabled={isPending}
                    >
                      {locale === loc && (
                        <CheckIcon className="me-2 size-4" />
                      )}
                      <span className={locale !== loc ? "ms-6" : ""}>
                        {localeNames[loc]}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Layout Direction Picker */}
              {/* <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PilcrowLeftIcon className="me-2 size-4" />
                  {t("layoutDirection")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => handleDirectionChange("ltr")}
                    disabled={isPending}
                  >
                    {direction === "ltr" && (
                      <CheckIcon className="me-2 size-4" />
                    )}
                    <span className={direction !== "ltr" ? "ms-6" : ""}>
                      LTR — Left to Right
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDirectionChange("rtl")}
                    disabled={isPending}
                  >
                    {direction === "rtl" && (
                      <CheckIcon className="me-2 size-4" />
                    )}
                    <span className={direction !== "rtl" ? "ms-6" : ""}>
                      RTL — Right to Left
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {!isSubLoading && isTrial && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <ClockIcon className="size-3.5 text-primary" />
                    {tSub("trialActive", { days: trialDaysLeft })}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing">
                      <SparklesIcon className="me-2 size-4" />
                      {t("upgradeToPremium")}
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {!isSubLoading && !isPremium && !isTrial && (
                <DropdownMenuItem asChild>
                  <Link href="/pricing">
                    <SparklesIcon className="me-2 size-4" />
                    {t("upgradeToPremium")}
                  </Link>
                </DropdownMenuItem>
              )}
              {!isSubLoading && isPremium && !isTrial && (
                <DropdownMenuItem onClick={redirectToPortal}>
                  <CreditCardIcon className="me-2 size-4" />
                  {t("manageSubscription")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon />
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
