import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPin, Mail } from "lucide-react"
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/ui/icons"
import { Reveal } from "@/components/ui/reveal"
import { SITE_CONFIG } from "@/lib/constants"

const socialLinks = [
  { name: "LinkedIn", href: SITE_CONFIG.socials.linkedin, icon: LinkedInIcon },
  { name: "GitHub", href: SITE_CONFIG.socials.github, icon: GitHubIcon },
  { name: "Instagram", href: SITE_CONFIG.socials.instagram, icon: InstagramIcon },
  { name: "Email", href: SITE_CONFIG.socials.email, icon: Mail },
]
const toolkit = ["Oracle Database 19c", "Oracle RAC", "PostgreSQL", "SQL Server", "MySQL", "Data Guard", "RMAN", "PL/SQL", "Linux Shell Scripting"]

export function AboutQuoteSection() {
  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto w-full max-w-7xl border-t border-border px-6 py-20 sm:px-10 lg:px-16">
      <Reveal className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="section-label">Engineering Philosophy & Persona</span>
          <h2 id="about-heading" className="mt-3">Behind the Systems & Databases</h2>
        </div>
        <Link href="/about" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm underline decoration-border underline-offset-4 hover:decoration-current">Read full bio & journey <ArrowRight className="size-4" /></Link>
      </Reveal>
      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal className="flex flex-col justify-between rounded-2xl border border-border bg-card p-7 sm:p-10 lg:p-12">
          <blockquote className="font-heading text-[clamp(1.65rem,2.6vw,2.5rem)] font-medium leading-[1.22] tracking-[-0.035em]">
            &ldquo;In enterprise banking, 99.99% database uptime isn&apos;t an afterthought—it is the foundation. I engineer resilient Oracle infrastructures, zero-downtime migrations, and performance optimizations that scale under mission-critical workloads.&rdquo;
          </blockquote>
          <div className="mt-10">
            <p className="font-medium">{SITE_CONFIG.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Database Administrator · Bank IBK Indonesia</p>
            <Link href="/about" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Discover my background <ArrowRight className="size-3.5" /></Link>
          </div>
        </Reveal>
        <Reveal delay={0.12} className="relative min-h-[420px] overflow-hidden rounded-2xl bg-card sm:min-h-[520px]">
          <Image src="/images/portrait-full.jpg" alt="Adam Hidayat, Database Administrator" fill sizes="(max-width: 1023px) 90vw, 45vw" className="object-cover object-[center_20%]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-6 pb-6 pt-24 text-white sm:px-8">
            <p className="mb-3 flex items-center gap-2 text-sm"><MapPin className="size-4" /> Jakarta, Indonesia</p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a key={name} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} aria-label={name} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-black/70 px-3.5 text-xs transition-colors hover:bg-white hover:text-black"><Icon className="size-3.5" />{name}</a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mt-7 flex flex-col gap-5 border-t border-border pt-6 lg:flex-row lg:items-start">
        <span className="shrink-0 py-2 text-sm text-muted-foreground">My technical toolkit</span>
        <ul className="flex flex-wrap gap-2" aria-label="Technical toolkit">
          {toolkit.map(skill => <li key={skill} className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{skill}</li>)}
        </ul>
      </div>
    </section>
  )
}
