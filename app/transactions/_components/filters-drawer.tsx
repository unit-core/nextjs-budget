"use client"

import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FiltersDrawerProps {
  searchValue: string
  onSearchChange: (value: string) => void
}

export function FiltersDrawer({ searchValue, onSearchChange }: FiltersDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-9">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Name</Label>
            <Input
              id="filter-name"
              placeholder="Filter by name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4">
          <DrawerClose asChild>
            <Button className="w-full">Done</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
