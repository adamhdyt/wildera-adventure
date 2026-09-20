"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScriptSearch() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [categories, setCategories] = useState<string[]>([])

  // Auto-discover categories from the DOM on mount
  useEffect(() => {
    const scripts = document.querySelectorAll(".script-item")
    const cats = new Set<string>()
    scripts.forEach((el) => {
      const cat = el.getAttribute("data-category")
      if (cat) cats.add(cat)
    })
    setCategories(Array.from(cats))
  }, [])

  useEffect(() => {
    const scripts = document.querySelectorAll(".script-item")
    let visibleCount = 0
    scripts.forEach((el) => {
      const htmlEl = el as HTMLElement
      const cat = htmlEl.getAttribute("data-category") || ""
      const text = htmlEl.textContent?.toLowerCase() || ""
      const q = query.trim().toLowerCase()

      const matchesCat = activeCategory === "All" || cat === activeCategory
      const matchesSearch = !q || text.includes(q)

      if (matchesCat && matchesSearch) {
        htmlEl.style.display = ""
        visibleCount++
      } else {
        htmlEl.style.display = "none"
      }
    })

    const emptyState = document.getElementById("empty-state")
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? "block" : "none"
    }
  }, [query, activeCategory])

  return (
    <div className="mt-2 space-y-4 mb-10">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scripts by name, keyword, or SQL..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
              activeCategory === cat
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div id="empty-state" className="hidden mt-8 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No scripts found matching your criteria.
      </div>
    </div>
  )
}
