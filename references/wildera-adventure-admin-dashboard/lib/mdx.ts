import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { z } from "zod"

export const postFrontmatterSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  category: z.enum(["tech", "life"]),
  tag: z.string(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string",
  }),
  readingTime: z.string(),
  featured: z.boolean().optional(),
  cover: z.string().optional(),
})

export type Category = "tech" | "life"

export type Post = z.infer<typeof postFrontmatterSchema> & {
  id: string
  slug: string
  content?: string
}

const contentDir = path.join(process.cwd(), "content")

/**
 * Reads and validates all posts from the file system.
 */
export function getAllPosts(category?: Category): Post[] {
  const categoriesToSearch: Category[] = category ? [category] : ["tech", "life"]
  let allPosts: Post[] = []

  for (const cat of categoriesToSearch) {
    const categoryDir = path.join(contentDir, cat)
    if (!fs.existsSync(categoryDir)) continue

    const files = fs.readdirSync(categoryDir)

    for (const filename of files) {
      if (!filename.endsWith(".mdx")) continue

      const slug = filename.replace(/\.mdx$/, "")
      const filePath = path.join(categoryDir, filename)
      const fileContent = fs.readFileSync(filePath, "utf-8")

      const { data } = matter(fileContent)

      const parsed = postFrontmatterSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(
          `Invalid frontmatter in ${filePath}:\n${parsed.error.message}`
        )
      }

      allPosts.push({
        ...parsed.data,
        id: slug,
        slug,
      })
    }
  }

  // Sort posts by date (newest first)
  return allPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/**
 * Gets a single post's metadata and its raw MDX content.
 */
export function getPostBySlug(category: Category, slug: string): Post | null {
  const filePath = path.join(contentDir, category, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const fileContent = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(fileContent)

  const parsed = postFrontmatterSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in ${filePath}:\n${parsed.error.message}`
    )
  }

  return {
    ...parsed.data,
    id: slug,
    slug,
    content,
  }
}
