import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Clock } from "lucide-react"
import type { Post } from "@/lib/mdx"
import { cn } from "@/lib/utils"

export function PostCard({
  post,
  href,
}: {
  post: Post
  href: string
}) {
  // --- HERO BACKGROUND VARIANT (For Featured Posts with Cover) ---
  if (post.featured && post.cover) {
    return (
      <article className="group relative flex min-h-[400px] w-full flex-col justify-end overflow-hidden rounded-2xl transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background sm:min-h-[480px]">
        {/* Background Image */}
        <Image
          src={post.cover}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md",
                post.category === "tech"
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-white/20 text-white",
              )}
            >
              {post.tag}
            </span>
            <span className="text-sm font-medium text-white/80">{post.date}</span>
          </div>

          <h3 className="mt-4 text-balance text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-white/80 sm:text-3xl lg:text-4xl">
            <Link
              href={href}
              className="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none"
            >
              {post.title}
            </Link>
          </h3>

          <p className="mt-3 line-clamp-2 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {post.excerpt}
          </p>

          <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-5">
            <span className="flex items-center gap-1.5 text-sm text-white/70">
              <Clock className="size-4" />
              {post.readingTime}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Read Story
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </article>
    )
  }

  // --- STANDARD CARD VARIANT (For Regular Posts or Featured without Cover) ---
  const hasCover = !!post.cover;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
      {/* Minimalist Background Variant */}
      {hasCover && (
        <>
          <div className="absolute inset-0 z-0 bg-muted/30" />
          <Image
            src={post.cover!}
            alt={post.title}
            fill
            className="object-cover opacity-30 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-50 dark:opacity-20 dark:group-hover:opacity-40"
          />
          <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-card/30 via-card/80 to-card" />
        </>
      )}
      
      <div className="relative z-10 flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-md",
              post.category === "tech"
                ? "bg-primary/15 text-primary"
                : "bg-accent/80 text-accent-foreground",
            )}
          >
            {post.tag}
          </span>
          <span className="text-xs font-medium text-muted-foreground/80">{post.date}</span>
        </div>

        <h3 className="mt-3 text-pretty text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary">
          <Link
            href={href}
            className="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {post.readingTime}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Read
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
