import { Metadata } from "next"
import Link from "next/link"
import { Mail, MapPin, Sparkles, Clock, ArrowUpRight } from "lucide-react"
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/ui/icons"
import { ContactNewsletterSection } from "@/components/home/contact-newsletter-section"

export const metadata: Metadata = {
  title: "Contact & Collaboration | Adam Hidayat",
  description: "Get in touch with Adam Hidayat for enterprise database consulting, Oracle tuning, high-availability architecture, or general inquiries.",
}

const directChannels = [
  {
    title: "Email",
    value: "adamhdyt11@gmail.com",
    href: "mailto:adamhdyt11@gmail.com",
    icon: Mail,
    badge: "Preferred",
    description: "Best for business inquiries, performance audits, and speaking invitations.",
  },
  {
    title: "LinkedIn",
    value: "adam-hidayat",
    href: "https://www.linkedin.com/in/adam-hidayat/",
    icon: LinkedInIcon,
    badge: "Professional",
    description: "Connect for professional networking and career conversations.",
  },
  {
    title: "GitHub",
    value: "adamhdyt",
    href: "https://github.com/adamhdyt",
    icon: GitHubIcon,
    badge: "Code & Scripts",
    description: "Explore open-source database scripts, SQL utilities, and repos.",
  },
  {
    title: "Instagram",
    value: "@adamhdyt",
    href: "https://www.instagram.com/adamhdyt/",
    icon: InstagramIcon,
    badge: "Personal",
    description: "Mountain summits, trail journals, and life outside tech.",
  },
]

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16">
      {/* Editorial Header */}
      <div className="max-w-3xl mb-16">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          Get In Touch
        </span>
        <h1 className="editorial-title mt-4 text-foreground">
          Let&apos;s Connect & Collaborate
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          I&apos;m always glad to talk with fellow database administrators, engineering leaders, or mountain enthusiasts. Feel free to reach out directly through any of the channels below.
        </p>

        {/* Location & Status Pill */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" />
            <span>Jakarta, Indonesia (GMT+7)</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Typically replies within 24 hours</span>
          </div>
        </div>
      </div>

      {/* 4 Direct Channels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {directChannels.map(({ title, value, href, icon: Icon, badge, description }) => (
          <a
            key={title}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm p-6 sm:p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Icon className="size-5" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border/50 px-2.5 py-1 rounded-full">
                  {badge}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                {value}
              </span>
              <span className="inline-flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                Connect
                <ArrowUpRight className="size-3.5" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Embedded Newsletter Section */}
      <ContactNewsletterSection />
    </div>
  )
}
