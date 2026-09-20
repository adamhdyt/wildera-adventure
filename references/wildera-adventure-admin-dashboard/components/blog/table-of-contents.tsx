"use client"

import { useEffect, useState } from "react"
import { ChevronDown, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Delay slightly to ensure MDX content has been rendered
    const timer = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll("article h2, article h3"))
      const items: TocItem[] = elements.map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: Number(el.tagName.charAt(1)),
      })).filter((item) => item.id)

      setHeadings(items)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-100px 0% -60% 0%" }
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  const renderLinks = () => (
    <ul className="space-y-2.5 text-sm">
      {headings.map((heading) => (
        <li
          key={heading.id}
          style={{ paddingLeft: `${(heading.level - 2) * 1}rem` }}
        >
          <a
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById(heading.id)
              if (el) {
                // Find main scrollable container
                const mainElement = document.querySelector("main")
                if (mainElement && mainElement.scrollHeight > mainElement.clientHeight) {
                  mainElement.scrollTo({
                    top: el.offsetTop - 100,
                    behavior: "smooth"
                  })
                } else {
                  window.scrollTo({
                    top: el.offsetTop - 100,
                    behavior: "smooth",
                  })
                }
              }
              setIsOpen(false)
            }}
            className={cn(
              "block line-clamp-2 transition-colors hover:text-primary",
              activeId === heading.id
                ? "font-medium text-primary"
                : "text-muted-foreground"
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar (Visible >= 1280px) */}
      <div className="hidden xl:block">
        <div className="sticky top-28 w-[250px] shrink-0">
          <h4 className="mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            On this page
          </h4>
          <nav>{renderLinks()}</nav>
        </div>
      </div>

      {/* Mobile Collapsible (Visible < 1280px) */}
      <div className="mb-10 xl:hidden">
        <details
          className="group rounded-xl border border-border bg-card shadow-sm"
          open={isOpen}
          onClick={(e) => {
            e.preventDefault()
            setIsOpen(!isOpen)
          }}
        >
          <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold text-foreground marker:content-none hover:bg-accent/50 transition-colors rounded-xl">
            <span className="flex items-center gap-2 text-sm">
              <List className="size-4 text-muted-foreground" />
              Table of Contents
            </span>
            <span className="transition-transform duration-200 group-open:rotate-180">
              <ChevronDown className="size-4 text-muted-foreground" />
            </span>
          </summary>
          <div
            className="border-t border-border p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <nav>{renderLinks()}</nav>
          </div>
        </details>
      </div>
    </>
  )
}
