"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy
        </>
      )}
    </button>
  )
}
