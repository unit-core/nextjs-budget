"use client"

import { useEffect, useState } from "react"

export function useDirection(): "ltr" | "rtl" {
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr")

  useEffect(() => {
    const dir = document.documentElement.dir
    setDirection(dir === "rtl" ? "rtl" : "ltr")

    const observer = new MutationObserver(() => {
      const newDir = document.documentElement.dir
      setDirection(newDir === "rtl" ? "rtl" : "ltr")
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    })

    return () => observer.disconnect()
  }, [])

  return direction
}
