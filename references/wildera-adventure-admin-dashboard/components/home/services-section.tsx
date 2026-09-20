import React from "react"
import Image from "next/image"
import Link from "next/link"
import { ShieldCheck, Database, Zap, Cloud } from "lucide-react"
import { Reveal } from "@/components/ui/reveal"

const services = [
  {
    title: "Performance Tuning & Optimization",
    description: "Deep bottleneck diagnostics, AWR/ASH profiling, execution plan re-engineering, and index optimization cutting query runtimes by over 99%.",
    image: "/images/post-datalayer.png",
    icon: Zap,
    tag: "Tuning & Latency",
  },
  {
    title: "Oracle RAC & High Availability",
    description: "Multi-node Oracle Real Application Clusters (RAC), ASM storage, Grid Infrastructure, and zero-downtime database upgrades for tier-1 banking.",
    image: "/images/post-oracle.png",
    icon: Database,
    tag: "High Availability",
  },
  {
    title: "Disaster Recovery & Data Guard",
    description: "Automated Active Data Guard standby replication, RMAN backup pipelines, and disaster recovery drills ensuring zero transactional data loss.",
    image: "/images/post-rsc.png",
    icon: ShieldCheck,
    tag: "Disaster Recovery",
  },
  {
    title: "Cloud & Autonomous Systems",
    description: "Oracle Autonomous Database Cloud 2025 certified architecture, OCI database services, and modern multi-cloud data tier management.",
    image: "/images/tech_notes_banner.png",
    icon: Cloud,
    tag: "Cloud Database",
  },
]

export function ServicesSection() {
  return (
    <section className="relative px-6 py-20 sm:px-10 lg:px-16 max-w-6xl mx-auto border-t border-border/60">
      {/* Header (Webild Style) */}
      <Reveal className="max-w-2xl mb-14 space-y-4">
        <div className="section-label">
          <span>Services</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          What I Bring to the Table
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          End-to-end database administration and infrastructure services designed to make your core systems resilient, performant, and secure.
        </p>

        <div className="pt-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 rounded-full bg-foreground text-background px-6 py-3 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <div className="relative size-5 overflow-hidden rounded-full ring-1 ring-background">
              <Image
                src="/images/portrait.png"
                alt="Adam Hidayat"
                width={20}
                height={20}
                className="size-full object-cover"
              />
            </div>
            <span>Book a consultation</span>
          </Link>
        </div>
      </Reveal>

      {/* 2x2 Services Grid (Webild Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service, index) => (
          <Reveal
            delay={(index % 2) * 0.1}
            key={service.title}
            className="group flex flex-col rounded-2xl border border-border bg-card p-3 sm:p-4"
          >
            {/* Visual Preview */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-border/50">
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="rounded-full bg-black/90 px-3 py-1 text-xs font-semibold text-white border border-white/20">
                  {service.tag}
                </span>
              </div>
            </div>

            {/* Caption */}
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
