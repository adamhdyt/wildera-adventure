"use client"

import { useEffect, useState } from "react"

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Because we use a `<main>` with `overflow-y-auto` in our App Router layout,
      // the scroll event fires on `<main>`, not `window`.
      const mainElement = document.querySelector("main")
      
      let scrollTop = 0
      let scrollHeight = 0
      let clientHeight = 0

      if (mainElement) {
        scrollTop = mainElement.scrollTop
        scrollHeight = mainElement.scrollHeight
        clientHeight = mainElement.clientHeight
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop
        scrollHeight = document.documentElement.scrollHeight
        clientHeight = document.documentElement.clientHeight
      }

      if (scrollHeight === clientHeight || scrollHeight === 0) {
        setProgress(0)
        return
      }

      const currentProgress = (scrollTop / (scrollHeight - clientHeight)) * 100
      setProgress(Math.min(100, Math.max(0, currentProgress)))
    }

    const mainElement = document.querySelector("main")
    
    // Attach to both just in case the layout changes in the future
    window.addEventListener("scroll", handleScroll, { passive: true })
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll, { passive: true })
    }

    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (mainElement) {
        mainElement.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  return (
    <div className="fixed left-0 top-0 z-[100] h-[2px] w-full bg-transparent">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
