"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { PostCard } from "@/components/blog/post-card"
import type { Category, Post } from "@/lib/mdx"
import { cn } from "@/lib/utils"

export function PostListWithSearch({
  section,
  posts,
}: {
  section: Category
  posts: Post[]
}) {
  const [query, setQuery] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Extract all unique tags across these posts
  const allTags = Array.from(
    new Set(posts.map((post) => post.tag).filter(Boolean))
  ).sort()

  // Handle keyboard shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }
      if (e.key === "/") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const searchString = `${post.title} ${post.excerpt || ""} ${
      post.tag || ""
    }`.toLowerCase()
    
    const matchesQuery = !query || searchString.includes(query.toLowerCase())
    
    // If activeTags is empty, matchesTags is true.
    // Otherwise, post's tag must match one of the activeTags.
    const matchesTags =
      activeTags.length === 0 ||
      activeTags.includes(post.tag)

    return matchesQuery && matchesTags
  })

  return (
    <>
      {/* Search Bar & Tag Filters */}
      <div className="border-b border-border/80 bg-background px-6 py-4 sm:px-8">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${posts.length} posts... (Press '/' to focus)`}
            className="min-h-11 w-full rounded-md bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isActive = activeTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isActive}
                  className={cn(
                    "min-h-11 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    isActive
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Post Grid */}
      <div className="px-6 py-8 sm:px-8">
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className={post.featured && !query && activeTags.length === 0 ? "lg:col-span-2" : undefined}
              >
                <PostCard post={post} href={`/${section}/${post.id}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-border py-20 text-center">
            <h3 className="text-sm font-semibold text-foreground">No posts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search query or removing filters.
            </p>
            {activeTags.length > 0 || query ? (
              <button
                onClick={() => {
                  setQuery("")
                  setActiveTags([])
                }}
                className="mt-4 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Showing {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          {query || activeTags.length > 0 ? " matching your criteria" : " in this section"}.
        </p>
      </div>
    </>
  )
}
