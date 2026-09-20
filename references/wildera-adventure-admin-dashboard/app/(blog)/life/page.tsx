import { Metadata } from "next"
import { MainContent } from "@/components/blog/main-content"
import { getAllPosts } from "@/lib/mdx"

export const metadata: Metadata = {
  title: "Life",
  description: "Slower thoughts on habits, focus, and the world away from the keyboard.",
}

export default function LifePage() {
  const posts = getAllPosts("life")
  return <MainContent section="life" posts={posts} />
}
