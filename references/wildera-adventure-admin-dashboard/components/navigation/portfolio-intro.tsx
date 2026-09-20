"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { SITE_CONFIG } from "@/lib/constants"

export function PortfolioIntro({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!visible) {
      onComplete()
      return
    }
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionPreference.matches) {
      setVisible(false)
      return
    }

    const shell = document.getElementById("site-shell")
    shell?.setAttribute("inert", "")
    const timeout = window.setTimeout(() => setVisible(false), 2300)
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false)
    }
    const onMotionChange = () => {
      if (motionPreference.matches) setVisible(false)
    }
    window.addEventListener("keydown", dismiss)
    motionPreference.addEventListener("change", onMotionChange)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("keydown", dismiss)
      motionPreference.removeEventListener("change", onMotionChange)
      shell?.removeAttribute("inert")
    }
  }, [visible, onComplete])

  if (!visible) return null

  return (
    <div className="portfolio-intro" role="status" aria-label={`Opening ${SITE_CONFIG.name}'s portfolio`}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.animationName === "intro-exit") setVisible(false)
      }}>
      <div className="portfolio-intro-identity" aria-hidden="true">
        <Image
          src="/images/portrait.png"
          alt=""
          width={88}
          height={88}
          priority
          className="portfolio-intro-portrait"
        />
        <p className="portfolio-intro-name">
          {SITE_CONFIG.name}
          <span className="portfolio-intro-reveal">{SITE_CONFIG.name}</span>
        </p>
      </div>
      <div className="portfolio-intro-line" aria-hidden="true" />
    </div>
  )
}
