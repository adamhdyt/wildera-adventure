import { PostListWithSearch } from "@/components/blog/post-list-with-search"
import type { Category, Post } from "@/lib/mdx"

const sectionMeta: Record<Category, { title: string; description: string }> = {
  tech: {
    title: "Tech Notes",
    description: "Architecture, debugging stories, and lessons from building software.",
  },
  life: {
    title: "Life",
    description: "Slower thoughts on habits, focus, and the world away from the keyboard.",
  },
}

export function MainContent({
  section,
  posts,
}: {
  section: Category
  posts: Post[]
}) {
  const meta = sectionMeta[section]

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col pb-12">
      {/* Top bar (Title and Description only) */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background px-6 pt-16 pb-10 sm:px-8">
        <div>
          <h1 className="editorial-title text-foreground">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {/* Interactive Search and Post Grid */}
      <PostListWithSearch section={section} posts={posts} />
    </div>
  )
}
