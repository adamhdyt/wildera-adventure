"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { Mail, ArrowUpRight, Sparkles, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react"
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/ui/icons"
import { subscribe } from "@/app/actions/subscribe"

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/adam-hidayat/",
    icon: LinkedInIcon,
  },
  {
    name: "GitHub",
    href: "https://github.com/adamhdyt",
    icon: GitHubIcon,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/adamhdyt/",
    icon: InstagramIcon,
  },
]

export function ContactNewsletterSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || isPending) return

    setStatus("idle")
    setErrorMessage("")

    const formData = new FormData()
    formData.append("email", email)

    startTransition(async () => {
      try {
        const res = await subscribe(formData)
        if (res.error) {
          setStatus("error")
          setErrorMessage(res.error)
        } else {
          setStatus("success")
          setEmail("")
        }
      } catch {
        setStatus("error")
        setErrorMessage("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <section id="contact" className="relative px-6 py-20 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-border/60">
      {/* Section Header */}
      <div className="max-w-2xl mb-14">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          Get in Touch & Stay Connected
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Let&apos;s Build Something Resilient
        </h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          Whether you have a question about database optimization, an enterprise migration inquiry, or just want to chat about mountain hikes—my inbox is always open.
        </p>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Card: Direct Contact & Availability */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm p-8 sm:p-10 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
          <div>
            {/* Availability Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-6">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for DBA Consulting & Architecture</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
              Have a critical database bottleneck or high-availability challenge?
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Drop me an email directly. I respond promptly to inquiries regarding Oracle tuning, zero-downtime upgrades, and enterprise data tier reliability.
            </p>

            {/* Direct Email Action */}
            <div className="mt-8">
              <a
                href="mailto:adamhdyt11@gmail.com"
                className="group inline-flex items-center gap-3 rounded-2xl border border-border/80 bg-background px-5 py-3.5 text-sm font-semibold text-foreground shadow-sm hover:border-primary/50 hover:bg-foreground hover:text-background transition-all duration-200"
              >
                <Mail className="size-4 text-primary group-hover:text-background transition-colors" />
                <span>adamhdyt11@gmail.com</span>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-background transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Social Links Row */}
          <div className="mt-10 pt-6 border-t border-border/60 flex items-center gap-3">
            <span className="text-xs text-muted-foreground mr-1">Find me on:</span>
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-foreground hover:text-background transition-all"
                aria-label={name}
              >
                <Icon className="size-3.5" />
                <span>{name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right Card: Newsletter Subscription */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl border border-border/80 bg-card/70 backdrop-blur-sm p-8 sm:p-10 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
          <div>
            <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Send className="size-5" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              The DBA Field Dispatch
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Subscribe to receive occasional notes on Oracle performance tuning, query optimization patterns, and engineering war stories from banking production environments.
            </p>

            {/* Newsletter Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email..."
                  required
                  disabled={isPending || status === "success"}
                  className="flex-1 rounded-xl border border-border bg-background/90 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  aria-label="Email for newsletter"
                />
                <button
                  type="submit"
                  disabled={isPending || status === "success"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-sm font-semibold hover:bg-foreground/90 transition-all disabled:opacity-50 shadow-sm shrink-0"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>

              {/* Status feedback */}
              {status === "success" && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Thank you for subscribing! You&apos;re on the list for new dispatches.</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>

          <div className="mt-10 pt-6 border-t border-border/60 text-xs text-muted-foreground">
            Zero spam. Unsubscribe anytime with a single click.
          </div>
        </div>
      </div>
    </section>
  )
}
