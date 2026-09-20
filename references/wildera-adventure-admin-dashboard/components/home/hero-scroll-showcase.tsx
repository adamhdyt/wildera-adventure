"use client"

import { useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion"
import { ArrowRight, FileText, Mail } from "lucide-react"
import { SITE_CONFIG } from "@/lib/constants"
import { useEntranceReady } from "@/components/ui/entrance-context"
import { Reveal } from "@/components/ui/reveal"

export const showcaseProjects = [
  {
    id: "upgrade",
    title: "Production Database Upgrade",
    tag: "Oracle 19c",
    metric: "Zero Downtime",
    description: "Critical migration & upgrade of enterprise banking databases from 12c to 19c (RU 19.27) ensuring zero data loss and seamless failover.",
    image: "/images/post-oracle.png",
    href: "/tech/oracle-19c-production-upgrade",
  },
  {
    id: "tuning",
    title: "Performance Optimization",
    tag: "Query Tuning",
    metric: "99% Faster",
    description: "Re-engineered bottlenecked execution plans, table partitioning, and indexing strategy, slashing batch financial query latency by over 99%.",
    image: "/images/post-datalayer.png",
    href: "/tech/batch-query-optimization-99-percent",
  },
  {
    id: "training",
    title: "International DBA Training",
    tag: "Global DBA",
    metric: "Seoul, Korea",
    description: "Selected for intensive enterprise DBA training at Industrial Bank of Korea (IBK) Headquarters in Seoul, mastering advanced HA, RAC, and DR operations.",
    image: "/images/tech_notes_banner.png",
    href: "/tech/ibk-headquarters-seoul-dba-training",
  },
]

type CardOrigin = { x: number; y: number; scale: number; rotate: number }
type StackLayout = { origins: CardOrigin[]; start: number; end: number }

export function HeroScrollShowcase() {
  const ready = useEntranceReady()
  const reduceMotion = useReducedMotion()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<StackLayout | null>(null)
  const { scrollY } = useScroll()
  const progress = useTransform(scrollY, [layout?.start ?? 0, layout?.end ?? 1], [0, 1])

  useLayoutEffect(() => {
    if (reduceMotion) return
    const wrapper = wrapperRef.current
    const stack = stackRef.current
    const grid = gridRef.current
    if (!wrapper || !stack || !grid) return
    const measure = () => {
      const slots = Array.from(grid.querySelectorAll<HTMLElement>("[data-project-slot]"))
      if (slots.length !== showcaseProjects.length) return
      // Measure the stationary slots, never the transformed cards inside them.
      const target = stack.getBoundingClientRect()
      const pageY = window.scrollY
      const desktop = window.innerWidth >= 768
      const start = desktop
        ? wrapper.getBoundingClientRect().top + pageY
        : Math.max(0, target.top + pageY - window.innerHeight * 0.5)
      const workTop = grid.closest("section")!.getBoundingClientRect().top + pageY
      const end = Math.max(start + 200, workTop - Math.min(180, window.innerHeight * 0.22))
      setLayout({
        start,
        end,
        origins: slots.map((slot, index) => {
          const rect = slot.getBoundingClientRect()
          const scale = Math.min(desktop ? 1.04 : 0.84, (target.width - 72) / (rect.width * 1.12), (target.height - 40) / (rect.height * 1.12))
          return {
            x: target.left + target.width / 2 - (rect.left + rect.width / 2) + (index - 1) * (desktop ? 24 : 12),
            y: target.top + target.height / 2 - (rect.top + rect.height / 2) + (index === 1 ? -12 : 0),
            scale: scale * (1 - index * 0.025),
            rotate: [-7, 2, 9][index],
          }
        }),
      })
    }
    let frame = 0
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure) }
    measure()
    const observer = new ResizeObserver(schedule)
    for (const element of [wrapper, stack, grid]) observer.observe(element)
    window.addEventListener("resize", schedule)
    document.fonts.addEventListener("loadingdone", schedule)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", schedule)
      document.fonts.removeEventListener("loadingdone", schedule)
    }
  }, [reduceMotion])

  return (
    <div ref={wrapperRef} className="hero-work mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
      <section className="grid items-center gap-8 pt-16 pb-12 md:min-h-[680px] md:grid-cols-2 md:gap-12 md:py-24 motion-reduce:md:grid-cols-1">
        <motion.div initial={false} animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 12 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="hero-entrance min-w-0 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
            <span className="status-dot" aria-hidden="true" />
            <span>Open to opportunities</span>
            <span className="text-muted-foreground">· Jakarta, Indonesia</span>
          </div>
          <h1 className="hero-headline">Databases that command reliability.</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            I engineer, optimize, and scale mission-critical enterprise database architectures with an uncompromising focus on peak performance, tight security, and <span className="font-medium text-foreground">high availability</span>. Over 4 years of production experience across Oracle 19c RAC, SQL Server, and PostgreSQL in the banking sector.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={SITE_CONFIG.cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-medium text-background transition-transform hover:-translate-y-0.5 active:translate-y-0">
              <FileText className="size-4" /> Download CV (PDF)
            </a>
            <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-xs font-medium transition-colors hover:bg-accent">
              <Mail className="size-4" /> Get in Touch
            </Link>
          </div>
          <dl className="grid grid-cols-3 gap-3 border-t border-border pt-5">
            {[['4+ Years', 'Enterprise DBA'], ['6 Certs', 'Oracle University'], ['Tier-1', 'Banking Industry']].map(([value, label]) => (
              <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-heading text-xl font-semibold tracking-tight sm:text-2xl">{value}</dd></div>
            ))}
          </dl>
        </motion.div>
        <div ref={stackRef} aria-hidden="true" className="hero-stack h-[280px] sm:h-[340px] md:h-[380px] motion-reduce:hidden" />
      </section>
      <section id="projects" className="pb-20 pt-10 md:pt-6" aria-labelledby="projects-heading">
        <Reveal className="mx-auto mb-10 max-w-3xl text-center">
          <span className="section-label mb-4">Selected Work</span>
          <h2 id="projects-heading">Projects That Speak for Themselves</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">A curated selection of mission-critical database engineering achievements that drove enterprise stability and performance.</p>
        </Reveal>
        <div ref={gridRef} className="grid gap-10 md:grid-cols-3 md:gap-6">
          {showcaseProjects.map((project, index) => (
            <article key={project.id} className="min-w-0">
              <div data-project-slot className="relative aspect-[16/11]">
                <TravelingCard progress={progress} origin={!reduceMotion ? layout?.origins[index] : undefined} index={index}>
                  <div className="project-print h-full border border-border p-2">
                    <div className="relative h-full overflow-hidden rounded-xl bg-zinc-900">
                      <Image src={project.image} alt={project.title} fill priority sizes="(max-width: 767px) 90vw, 33vw" className="object-cover" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-900">{project.tag}</span>
                      <span className="absolute right-3 top-3 rounded-full bg-zinc-900/95 px-2.5 py-1 text-[11px] text-white">{project.metric}</span>
                    </div>
                  </div>
                </TravelingCard>
              </div>
              <Reveal delay={index * 0.08} className="relative mt-6">
                <h3 className="text-xl font-semibold leading-tight">{project.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
                <Link href={project.href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-current">Read case study <ArrowRight className="size-3.5" /></Link>
              </Reveal>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center"><Link href="/tech" className="inline-flex min-h-11 items-center gap-3 rounded-full border border-border bg-card px-6 py-3 text-sm transition-colors hover:bg-accent">View all my projects <ArrowRight className="size-4" /></Link></div>
      </section>
    </div>
  )
}

function TravelingCard({ progress, origin, index, children }: { progress: MotionValue<number>; origin?: CardOrigin; index: number; children: React.ReactNode }) {
  const ready = useEntranceReady()
  const x = useTransform(progress, [0, 1], [origin?.x ?? 0, 0])
  const y = useTransform(progress, [0, 1], [origin?.y ?? 0, 0])
  const rotate = useTransform(progress, [0, 1], [origin?.rotate ?? 0, 0])
  const scale = useTransform(progress, [0, 1], [origin?.scale ?? 1, 1])
  return <motion.div data-traveling-card style={{ x, y, rotate, scale, zIndex: 3 - index }} className="relative h-full w-full"><motion.div initial={false} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.7, delay: index * 0.1 }} className="h-full">{children}</motion.div></motion.div>
}
