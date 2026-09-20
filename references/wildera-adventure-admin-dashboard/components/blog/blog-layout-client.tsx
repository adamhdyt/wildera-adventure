"use client"

import { FloatingPillNav } from "@/components/navigation/floating-pill-nav"
import { Footer } from "@/components/navigation/footer"
import { ScrollToTop } from "@/components/blog/scroll-to-top"
import { MotionConfig } from "framer-motion"
import { PortfolioIntro } from "@/components/navigation/portfolio-intro"
import { useCallback, useState } from "react"
import { EntranceContext } from "@/components/ui/entrance-context"

export function BlogLayoutClient({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const completeIntro = useCallback(() => setReady(true), [])
  return (
    <MotionConfig reducedMotion="user">
    <EntranceContext.Provider value={ready}>
    <PortfolioIntro onComplete={completeIntro} />
    <div id="site-shell" className="min-h-screen flex flex-col bg-background text-foreground">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <FloatingPillNav />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full pt-24">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
    </EntranceContext.Provider>
    </MotionConfig>
  )
}
