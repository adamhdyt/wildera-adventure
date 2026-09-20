import { Post } from "@/lib/mdx"
import { PostCard } from "@/components/blog/post-card"

export function RelatedPosts({
  currentPost,
  allPosts,
}: {
  currentPost: Post
  allPosts: Post[]
}) {
  // Find posts with the same tag, excluding the current post
  const related = allPosts
    .filter((p) => p.tag === currentPost.tag && p.id !== currentPost.id)
    .slice(0, 2)

  if (related.length === 0) {
    return null
  }

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {related.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            href={`/${post.category}/${post.slug}`}
          />
        ))}
      </div>
    </section>
  )
}
