import React from "react"
import Link from "next/link"
import { Mail, Globe } from "lucide-react"
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/ui/icons"

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
  {
    name: "Email",
    href: "mailto:adamhdyt11@gmail.com",
    icon: Mail,
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full px-6 sm:px-10 lg:px-16 py-12 mt-auto">
      <div className="editorial-footer max-w-6xl mx-auto border border-border p-8 sm:p-14 lg:p-16">
        {/* Giant Surname Typography (Webild Creative Portfolio Signature Footer) */}
        <div className="overflow-hidden">
          <h2 className="text-[clamp(4rem,16vw,12rem)] font-medium tracking-[-0.06em] text-foreground text-center leading-none select-none py-2">
            Hidayat
          </h2>
        </div>

        {/* Thin Divider Line */}
        <div className="border-t border-border/60 mt-8 sm:mt-12 mb-6" />

        {/* Bottom Bar: Copyright & Circular Social Icons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Adam Hidayat. All rights reserved.</p>

          <div className="flex items-center gap-2.5">
            {socialLinks.map(({ name, href, icon: Icon }) => (
              <a
                key={name}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex size-11 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 active:scale-95 transition-transform"
                aria-label={name}
                title={name}
              >
                <Icon className="size-4 text-background" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
