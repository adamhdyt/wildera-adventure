"use client"

import Giscus from "@giscus/react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function Comments() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="mt-12 pt-8 border-t border-border w-full min-h-[300px]" />

  const currentTheme = theme === "dark" || resolvedTheme === "dark" ? "transparent_dark" : "light"

  return (
    <div className="mt-12 pt-8 border-t border-border w-full">
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
        Comments
      </h2>
      <div className="min-h-[300px]">
        <Giscus
          id="comments"
          repo="adamhdyt/damz-projects"
          repoId="R_kgDOTW_ZDg" 
          category="General"
          categoryId="DIC_kwDOTW_ZDs4DCsgY"
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={currentTheme}
          lang="en"
          loading="lazy"
        />
      </div>
    </div>
  )
}
