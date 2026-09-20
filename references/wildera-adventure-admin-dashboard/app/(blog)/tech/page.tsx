import { Metadata } from "next"
import { MainContent } from "@/components/blog/main-content"
import { getAllPosts } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Tech Notes",
  description: "Architecture, debugging stories, and lessons from building software.",
}

export default function TechPage() {
  const posts = getAllPosts("tech")
  return <MainContent section="tech" posts={posts} />
}
