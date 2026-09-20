"use client"

import { LinkIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank")
  }

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank")
  }

  return (
    <div className="flex items-center gap-2 mt-8 mb-4">
      <span className="text-sm font-medium text-muted-foreground mr-2">Share this post:</span>
      <button
        onClick={shareTwitter}
        className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-[#1DA1F2] hover:text-white"
        aria-label="Share on Twitter"
      >
        <TwitterIcon className="size-4" />
      </button>
      <button
        onClick={shareLinkedIn}
        className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-[#0077b5] hover:text-white"
        aria-label="Share on LinkedIn"
      >
        <LinkedInIcon className="size-4" />
      </button>
      <button
        onClick={copyLink}
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors",
          copied 
            ? "bg-green-500/20 text-green-600 dark:bg-green-500/20 dark:text-green-400"
            : "bg-muted text-muted-foreground hover:bg-foreground hover:text-background"
        )}
        aria-label="Copy link"
      >
        <LinkIcon className="size-4" />
      </button>
    </div>
  )
}
