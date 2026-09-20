import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  Database,
  Building,
  Award,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react"
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/ui/icons"
import { Reveal } from "@/components/ui/reveal"

export const metadata: Metadata = {
  title: "About Adam Hidayat — Database Administrator",
  description: "Learn more about Adam Hidayat, enterprise Database Administrator specializing in Oracle RAC, cloud databases, query optimization, and infrastructure resilience.",
}

const experience = [
  {
    role: "Database Administrator",
    company: "PT Bank IBK Indonesia Tbk",
    period: "2021 — Present",
    description:
      "Overseeing mission-critical Oracle core banking databases, high-availability RAC clusters, disaster recovery setups, and database upgrades across multi-tier environments.",
    highlights: [
      "Led full Oracle Database 12c to 19c (RU 19.27) zero-downtime production upgrade.",
      "Re-engineered critical end-of-month financial batch jobs, slashing query latency by >99%.",
      "Handpicked for international technical training at Industrial Bank of Korea (IBK) Headquarters in Seoul.",
    ],
  },
]

const competencies = [
  {
    category: "RDBMS Platforms",
    skills: ["Oracle Database 19c / 12c", "Oracle RAC & Grid Infrastructure", "PostgreSQL", "Microsoft SQL Server", "MySQL"],
  },
  {
    category: "Performance & Tuning",
    skills: ["AWR & ASH Diagnostics", "SQL Tuning Advisor", "Execution Plan Analysis", "Index Defragmentation", "Latch & Lock Contention"],
  },
  {
    category: "High Availability & DR",
    skills: ["Oracle Data Guard (Physical Standby)", "RMAN Automated Backup & Point-in-Time Recovery", "Active Data Guard", "Disaster Recovery Drills"],
  },
  {
    category: "Cloud & Automation",
    skills: ["Oracle Autonomous Database 2025", "OCI Database Services", "Linux Shell Scripting (Bash)", "PL/SQL Automation Packages"],
  },
]

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16">
      {/* Hero / Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
        {/* Left: Bio Text */}
        <div className="lg:col-span-7">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Biography & Engineering Journey
          </span>
          <h1 className="editorial-title mt-4 text-foreground">
            Hi, I&apos;m Adam Hidayat. I keep enterprise data online, fast, and secure.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
            I am a Database Administrator based in Jakarta, Indonesia, with over 4 years of experience specializing in Oracle enterprise infrastructures, high-availability clustering, and performance optimization in the commercial banking sector.
          </p>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            When systems carry transactions for hundreds of thousands of customers, there is no margin for failure. My engineering philosophy centers on proactive performance management, rigorous disaster recovery preparation, and building resilient architectures that scale smoothly under load.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-primary" />
              <span>Jakarta, Indonesia</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground">
              <Building className="size-3.5 text-primary" />
              <span>Bank IBK Indonesia</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground">
              <Award className="size-3.5 text-primary" />
              <span>6x Oracle Certified</span>
            </div>
          </div>
        </div>

        {/* Right: Portrait Card */}
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden border border-border/80 bg-card shadow-lg">
            <Image
              src="/images/portrait-full.jpg"
              alt="Adam Hidayat — Database Administrator"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-[center_20%]"
              priority
            />
          </div>
        </div>
      </div>

      {/* Experience Timeline */}
      <section id="experience" aria-labelledby="experience-heading" className="mb-20 grid items-start gap-10 border-t border-border pt-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32">
          <span className="section-label">
            Experience & Impact
          </span>
          <h2 id="experience-heading" className="mt-4 font-heading text-[clamp(2rem,3.5vw,3.5rem)] font-medium leading-[1.08] tracking-tight">
            Where I&apos;ve Been Engineering
          </h2>
          <Link href="/#projects" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm underline decoration-foreground/30 underline-offset-4">Read the project case studies <ArrowRight className="size-4" /></Link>
        </div>

        <div className="border-l border-border pl-6 sm:pl-8">
          {experience.map((item) => (
            <Reveal
              key={item.company}
              className="relative pb-6"
            >
              <span aria-hidden="true" className="absolute -left-[29px] top-1 size-2 rounded-full bg-status ring-4 ring-background sm:-left-[37px]" />
              <p className="text-xs text-muted-foreground">{item.period}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">{item.role}</h3>
              <p className="mt-2 text-base">{item.company}</p>

              <p className="mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              <details className="experience-details mt-6 border-y border-border">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-5 py-3 text-sm font-medium">Responsibilities & impact <span aria-hidden="true" className="text-xl">+</span></summary>
                <ul className="list-disc space-y-3 pb-5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {item.highlights.map(h => <li key={h}>{h}</li>)}
                </ul>
              </details>
              <div className="mt-6 flex flex-wrap gap-2">
                {competencies[0].skills.map(skill => <span key={skill} className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{skill}</span>)}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Core Competencies Grid */}
      <section className="mb-20 border-t border-border/60 pt-16">
        <div className="max-w-2xl mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Technical Arsenal
          </h2>
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Core Competencies & Tooling
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competencies.map((comp) => (
            <div
              key={comp.category}
              className="rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm p-6 sm:p-8"
            >
              <h4 className="text-base font-bold text-foreground mb-4">{comp.category}</h4>
              <div className="flex flex-wrap gap-2">
                {comp.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    <span className="size-1.5 rounded-full bg-primary" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Off the Screen / Mountain & Life */}
      <section className="border-t border-border/60 pt-16 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Compass className="size-3.5 text-amber-500" />
              Off-Screen Pursuits
            </span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Beyond the Command Line
            </h3>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
              When I step away from database consoles and terminal multiplexers, you will usually find me high up on mountain ridges across Indonesia, pitching tents above the clouds, or exploring local coffee roasters.
            </p>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Hiking high elevations demands the same discipline as enterprise infrastructure: careful preparation, respecting the terrain, carrying only what matters, and staying calm when unexpected weather hits.
            </p>

            <div className="mt-8">
              <Link
                href="/life"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-foreground hover:text-background transition-all"
              >
                Read Mountain Journals & Life Notes
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-border/80 bg-card shadow-md">
              <Image
                src="/images/sumbing/sumbing-crater-rim-view.webp"
                alt="Adam looking across the volcanic caldera of Mount Sumbing during his second hike"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
