import { Metadata } from "next"
import { AboutIntro } from "@/components/blog/about-intro"

export const metadata: Metadata = {
  title: "Adam Hidayat — Database Administrator",
  description: "Experienced Database Administrator specializing in Oracle, SQL Server, PostgreSQL, and MySQL. Sharing tech notes, performance optimization scripts, and life reflections.",
}

export default function HomePage() {
  return <AboutIntro />
}
