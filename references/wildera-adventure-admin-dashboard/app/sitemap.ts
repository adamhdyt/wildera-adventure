import { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/mdx"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://adamhdyt.com"

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tech`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/life`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const techPosts = getAllPosts("tech").map((post) => ({
    url: `${baseUrl}/tech/${post.id}`,
    lastModified: new Date(post.date), // Or file system mtime if available
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const lifePosts = getAllPosts("life").map((post) => ({
    url: `${baseUrl}/life/${post.id}`,
    lastModified: new Date(post.date), // Or file system mtime if available
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...techPosts, ...lifePosts]
}
