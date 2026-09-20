import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen, Clock, Calendar, Database, Compass, ChevronRight } from "lucide-react"
import { Post } from "@/lib/mdx"
import { Reveal } from "@/components/ui/reveal"

interface ContentPillarsProps {
  techPosts: Post[]
  lifePosts: Post[]
}

export function ContentPillars({ techPosts, lifePosts }: ContentPillarsProps) {
  // Take top 3 posts for each pillar
  const featuredTech = techPosts.slice(0, 3)
  const featuredLife = lifePosts.slice(0, 3)

  return (
    <section className="relative px-6 py-20 sm:px-10 lg:px-16 max-w-7xl mx-auto border-t border-border/60">
      {/* Section Header */}
      <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-primary" />
            Content Pillars & Field Notes
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Selected Writing & Reflections
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Mission-critical database engineering logs alongside journals from mountain summits and life beyond the terminal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tech"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tech Notes →
          </Link>
          <span className="text-border">•</span>
          <Link
            href="/life"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Life & Off-Screen →
          </Link>
        </div>
      </Reveal>

      {/* 2 Big Pillar Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
        {/* PILLAR 1: TECH NOTES */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div>
            {/* Pillar Header */}
            <div className="flex items-start justify-between pb-6 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Database className="size-5" />
                </span>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Engineering & Systems
                  </span>
                  <h3 className="text-xl font-bold text-foreground">Tech Notes</h3>
                </div>
              </div>

              <Link
                href="/tech"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Articles List */}
            <div className="mt-6 space-y-4">
              {featuredTech.map((post) => (
                <Link
                  key={post.slug}
                  href={`/tech/${post.slug}`}
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border/50 bg-background/60 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-accent/40 hover:shadow-sm"
                >
                  {/* Thumbnail */}
                  {post.cover && (
                    <div className="relative aspect-[16/10] sm:aspect-square w-full sm:w-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/40">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 80px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">
                        {post.tag}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {post.readingTime}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h4>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pillar Footer CTA */}
          <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {techPosts.length} articles on Oracle, tuning & architecture
            </span>
            <Link
              href="/tech"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors group"
            >
              Browse all tech notes
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* PILLAR 2: LIFE & REFLECTIONS */}
        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div>
            {/* Pillar Header */}
            <div className="flex items-start justify-between pb-6 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground">
                  <Compass className="size-5" />
                </span>
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Off-Duty & Reflections
                  </span>
                  <h3 className="text-xl font-bold text-foreground">Life & Mountains</h3>
                </div>
              </div>

              <Link
                href="/life"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Articles List */}
            <div className="mt-6 space-y-4">
              {featuredLife.map((post) => (
                <Link
                  key={post.slug}
                  href={`/life/${post.slug}`}
                  className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border/50 bg-background/60 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-accent/40 hover:shadow-sm"
                >
                  {/* Thumbnail */}
                  {post.cover && (
                    <div className="relative aspect-[16/10] sm:aspect-square w-full sm:w-20 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/40">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 80px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground/80">
                        {post.tag}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {post.readingTime}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h4>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pillar Footer CTA */}
          <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {lifePosts.length} stories from trails, hobbies & reflections
            </span>
            <Link
              href="/life"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors group"
            >
              Browse all life posts
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
