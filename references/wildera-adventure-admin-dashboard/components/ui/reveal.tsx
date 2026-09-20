"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { useEntranceReady } from "@/components/ui/entrance-context"

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -32px 0px" })
  const reduce = useReducedMotion()
  const ready = useEntranceReady()
  const [mounted, setMounted] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => setMounted(true), [])
  const visible = !mounted || reduce || focused || (ready && inView)

  return (
    <motion.div ref={ref} data-reveal className={className} initial={false}
      onFocusCapture={() => setFocused(true)}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduce || focused ? 0 : 0.7, delay: visible && !reduce && !focused ? delay : 0, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}
