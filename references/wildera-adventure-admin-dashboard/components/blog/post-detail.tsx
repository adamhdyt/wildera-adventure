import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Post } from "@/lib/mdx"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { getAllPosts } from "@/lib/mdx"
import { RelatedPosts } from "@/components/blog/related-posts"
import { ShareButtons } from "@/components/blog/share-buttons"
import { Comments } from "@/components/blog/comments"

export function PostDetail({
  post,
  backHref,
  children,
}: {
  post: Post
  backHref: string
  children: React.ReactNode
}) {
  const allPosts = getAllPosts()

  return (
    <main className="flex h-full flex-col">
      <ReadingProgress />
      <div className="flex items-center gap-3 border-b border-border/80 bg-background px-6 py-4 sm:px-8">
        <Link
          href={backHref}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <span className="truncate text-sm text-muted-foreground">
          {post.category === "tech" ? "Tech Notes" : "Life"} / {post.tag}
        </span>
      </div>

      <div className="px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl xl:grid xl:grid-cols-[1fr_250px] xl:gap-16">
          <article className="mx-auto w-full max-w-3xl xl:max-w-none">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
              {post.tag}
            </span>
            <h1 className="editorial-title mt-4 text-foreground">
              {post.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {post.date} · {post.readingTime}
            </p>
            <div className="mt-8">
              <div className="xl:hidden">
                <TableOfContents />
              </div>
              <div className="text-[15px] leading-relaxed text-muted-foreground">
                <p className="text-lg text-foreground mb-8">{post.excerpt}</p>
                {children}
                <ShareButtons title={post.title} />
                <hr className="my-10 border-border" />
                <RelatedPosts currentPost={post} allPosts={allPosts} />
                <Comments />
              </div>
            </div>
          </article>
          
          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </main>
  )
}
