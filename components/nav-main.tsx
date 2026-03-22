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
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            { (user === undefined || user === null) ? 
              <SidebarMenuButton
                tooltip="Quick Create"
                disabled={user === undefined}
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <Spinner />
                <span>Quick Create</span>
              </SidebarMenuButton> : 
              <Sheet>
                <SheetTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Quick Create"
                    className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  >
                    <CirclePlusIcon
                    />
                    <span>Quick Create</span>
                  </SidebarMenuButton>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>Are you absolutely sure?</SheetTitle>
                    <SheetDescription>This action cannot be undone.</SheetDescription>
                  </SheetHeader>
                  <div className="flex h-full w-full p-4 flex-col">
                    <FileUploadDemo user={user}/>
                  </div>
                </SheetContent>
              </Sheet>
            }

            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon
              />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
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
