"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, HelpCircle } from "lucide-react"
import { Reveal } from "@/components/ui/reveal"

const FAQ_CATEGORIES = ["General", "Enterprise DBA", "Performance", "Certifications"] as const
type FAQCategory = (typeof FAQ_CATEGORIES)[number]

interface FAQItem {
  id: string
  category: FAQCategory
  question: string
  answer: string
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "environments",
    category: "General",
    question: "What kind of database environments do you specialize in?",
    answer:
      "I specialize primarily in mission-critical Oracle enterprise architectures (12c, 19c RAC, Multitenant CDB/PDB) with extensive production experience in PostgreSQL, Microsoft SQL Server, and MySQL within commercial banking environments.",
  },
  {
    id: "tuning",
    category: "Performance",
    question: "How do you approach query optimization and bottleneck diagnosis?",
    answer:
      "I start with database-level wait event analysis using AWR, ASH, and ADDM reports to identify whether bottlenecks stem from I/O latency, concurrency locks, CPU saturation, or parse locks. From there, I re-engineer SQL execution plans, index layouts, and partitioning strategies—such as cutting end-of-month batch execution times by over 99%.",
  },
  {
    id: "upgrades",
    category: "Enterprise DBA",
    question: "What is your experience with zero-downtime database upgrades?",
    answer:
      "I have successfully led enterprise database migrations from Oracle 12c to 19c (RU 19.27). By leveraging Oracle Data Guard rolling standby switchovers, pre-upgrade testing with Real Application Testing (RAT), and comprehensive fallback procedures, core banking operations continued without transactional disruption.",
  },
  {
    id: "ha-dr",
    category: "Enterprise DBA",
    question: "How do you ensure disaster recovery and high availability?",
    answer:
      "I configure and manage multi-node Oracle RAC clusters with ASM storage and automated Active Data Guard replication across geographically distinct data centers. I also establish and test automated RMAN backup schedules with point-in-time recovery drills to meet strict RTO and RPO SLA requirements.",
  },
  {
    id: "certifications",
    category: "Certifications",
    question: "What verified credentials and certifications do you hold?",
    answer:
      "I hold 6 official Oracle University credentials, including Oracle Autonomous Database Cloud 2025 Certified Professional, Oracle Cloud Database Service 2025 Certified Professional, Oracle 19c Performance Management and Tuning, and Oracle 19c RAC Administration.",
  },
]

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("General")
  const [openId, setOpenId] = useState<string | null>("environments")

  const filteredItems = FAQ_DATA.filter((item) => item.category === activeCategory || activeCategory === "General")

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="faq" className="relative px-6 py-20 sm:px-10 lg:px-16 max-w-5xl mx-auto">
      {/* Container Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-12 lg:p-16">
        {/* Header */}
        <Reveal className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
            <HelpCircle className="size-3 text-primary" />
            <span>FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Everything you need to know about my database administration and engineering expertise.
          </p>

          {/* Category Tabs Pill Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {FAQ_CATEGORIES.map((category) => {
              const isActive = activeCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={isActive}
                  className={`min-h-11 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Accordion List */}
        <div className="space-y-3.5 max-w-3xl mx-auto">
          {filteredItems.map((item) => {
            const isOpen = openId === item.id
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-background/60 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-foreground">
                    {item.question}
                  </span>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    <Plus className="size-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Reach Out Bottom Banner (Webild Style) */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative size-10 overflow-hidden rounded-full ring-1 ring-border shrink-0">
              <Image
                src="/images/portrait.png"
                alt="Adam Hidayat"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-foreground">
                More questions? Reach out anytime.
              </div>
              <a
                href="mailto:adamhdyt11@gmail.com"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                adamhdyt11@gmail.com
              </a>
            </div>
          </div>

          <Link
            href="/contact"
            className="rounded-full bg-foreground text-background px-5 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  )
}
