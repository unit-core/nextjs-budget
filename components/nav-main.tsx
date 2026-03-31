"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, MailIcon } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { FileUploadDemo } from "./file-upload"
import { User } from '@supabase/supabase-js';
import { Spinner } from "./ui/spinner"
import { SidebarUser } from "@/components/app-sidebar"
import { toast } from "sonner"

import TextareaAutosize from "react-textarea-autosize"

import { createClient } from '@/lib/supabase/client'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  IconBrandJavascript,
  IconCopy,
  IconCornerDownLeft,
  IconRefresh,
} from "@tabler/icons-react"
import { usePathname } from 'next/navigation';

export function NavMain({
  items,
  user
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[],
  user: SidebarUser
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            { user === undefined || user === null ?
              <SidebarMenuButton
                tooltip="Quick Create"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Spinner />
                <span>Quick Create</span>
              </SidebarMenuButton> : 
              <DrawerDemo user={user}/>
            }
            {/* <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon
              />
              <span className="sr-only">Inbox</span>
            </Button> */}
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

import * as React from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

function DrawerDemo({ user }: { user: SidebarUser }) {
  const [goal, setGoal] = React.useState(350)

  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)))
  }
  const isMobile = useIsMobile()
  const direction = useDirection()
  return (
    <Drawer direction={isMobile ? "bottom" : direction === "rtl" ? "left" : "right"}>
      <DrawerTrigger asChild>
        <SidebarMenuButton
          tooltip="Quick Create"
          className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
        >
          <CirclePlusIcon />
          <span>Quick Create</span>
        </SidebarMenuButton>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle>Create Transactions</DrawerTitle>
            <DrawerDescription>Upload your receipts or describe expenses in your own words.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col p-4 gap-4">
            <Tabs defaultValue="image">
              <TabsList>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              <TabsContent value="image">
                <FileUploadDemo user={user}/>
              </TabsContent>
              <TabsContent value="text">
                <InputGroupCustom />
              </TabsContent>
              <TabsContent value="manual">
                {/* <InputGroupCustom /> */}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
import { useState } from 'react'
import { useIsMobile } from "@/hooks/use-mobile"
import { useDirection } from "@/hooks/use-direction"

function InputGroupCustom() {
  // 1. Создаем состояние для текста
  const [text, setText] = useState('')
  const [isLoading, setLoading] = useState(false)

  const saveNewTransaction = async () => {
    if (!text.trim()) return // Не отправляем пустую строку
    setLoading(true)
    const supabase = createClient()
    
    // 2. Используем переменную 'text' для отправки
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        source: {
          source_type: 'text',
          source: {
            text: text.trim()
          }
        }
      })
    setLoading(false)
    if (!error) {
      const currentDate = new Date()
      const dateString = currentDate.toLocaleDateString('en-US', {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      toast("Transaction has been created", {
        position: 'top-center',
        description: dateString
      })
      setText('') // Очищаем поле после успешной отправки
    }
  }

  return (
    <div className="grid w-full gap-6">
      <InputGroup>
        <TextareaAutosize
          value={text} // 3. Привязываем значение
          onChange={(e) => setText(e.target.value)} // 4. Обновляем при вводе
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
            disabled={!text.trim() || isLoading} // Хороший UX: кнопка неактивна, если пусто
          >
            {isLoading ? <Spinner /> : null }
            Submit
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
