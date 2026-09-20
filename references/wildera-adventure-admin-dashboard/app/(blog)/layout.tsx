import { BlogLayoutClient } from "@/components/blog/blog-layout-client"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BlogLayoutClient>{children}</BlogLayoutClient>
}
