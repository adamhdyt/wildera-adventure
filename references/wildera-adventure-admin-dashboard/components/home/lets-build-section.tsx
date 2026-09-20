"use client"

import React, { useState, useTransition } from "react"
import Image from "next/image"
import { Send, CheckCircle2, AlertCircle, Loader2, Video, Mail } from "lucide-react"
import { sendContactMessage } from "@/app/actions/contact"
import { SITE_CONFIG } from "@/lib/constants"

export function LetsBuildSection() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [botField, setBotField] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email || !name || !message || isPending) return

    setStatus("idle")
    setErrorMessage("")
    const formData = new FormData()
    formData.append("name", name)
    formData.append("email", email)
    formData.append("message", message)
    if (botField) formData.append("botField", botField)

    startTransition(async () => {
      try {
        const res = await sendContactMessage(formData)
        if (res.error) {
          setStatus("error")
          setErrorMessage(res.error)
        } else {
          setStatus("success")
          setName("")
          setEmail("")
          setMessage("")
        }
      } catch {
        setStatus("error")
        setErrorMessage("Something went wrong. Please try emailing me directly.")
      }
    })
  }

  return (
    <section id="contact" className="relative px-6 py-20 sm:px-10 lg:px-16 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-12">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 px-3.5 py-1 text-xs font-medium text-muted-foreground mb-4">
              <span>Get in Touch</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Let&apos;s Build
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Have an enterprise database challenge, migration plan, or query tuning project in mind? Drop me a message and I&apos;ll get back to you within 24 hours.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <input
                  aria-label="Your name"
                  autoComplete="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  disabled={isPending || status === "success"}
                  className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <input
                  aria-label="Your email"
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  disabled={isPending || status === "success"}
                  className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <textarea
                  aria-label="Your message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell me about your database challenge or project..."
                  required
                  disabled={isPending || status === "success"}
                  className="w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Honeypot Spam Trap */}
              <input
                type="text"
                name="botField"
                value={botField}
                onChange={(e) => setBotField(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <button
                type="submit"
                disabled={isPending || status === "success"}
                className="w-full rounded-2xl bg-foreground text-background py-3.5 px-6 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending message...</span>
                  </>
                ) : (
                  <span>Send Message</span>
                )}
              </button>

              {status === "success" && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Thank you! Your message has been sent directly to Adam. I will get back to you shortly.</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage || "Failed to send message. Please try emailing directly."}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Photo Card with Action Pill */}
        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-border bg-card min-h-[460px] flex flex-col justify-end p-5 sm:p-8">
          <Image
            src="/images/portrait-full.jpg"
            alt="Adam Hidayat"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Floating Pill Overlay */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full bg-black/90 px-4 py-2.5 text-xs font-semibold text-white border border-white/20 hover:bg-black transition-colors"
            >
              <Mail className="size-3.5" />
              <span>{SITE_CONFIG.email}</span>
            </a>

            <div className="text-right text-xs text-white/80 hidden sm:block">
              {SITE_CONFIG.location}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
