import { HeroScrollShowcase } from "@/components/home/hero-scroll-showcase"
import { AboutQuoteSection } from "@/components/home/about-quote-section"
import { ServicesSection } from "@/components/home/services-section"
import { CertificationsGrid } from "@/components/home/certifications-grid"
import { ContentPillars } from "@/components/home/content-pillars"
import { FAQSection } from "@/components/home/faq-section"
import { LetsBuildSection } from "@/components/home/lets-build-section"
import { getAllPosts } from "@/lib/mdx"

export function AboutIntro() {
  const techPosts = getAllPosts("tech")
  const lifePosts = getAllPosts("life")

  return (
    <div className="editorial-home flex h-full flex-col">
      {/* 01: Hero to Selected Work with Signature Un-tilting Scroll Animation */}
      <HeroScrollShowcase />

      {/* 02: Editorial Philosophy Quote & Portrait Card */}
      <AboutQuoteSection />

      {/* 03: What I Bring to the Table (2x2 Services Grid) */}
      <ServicesSection />

      {/* 04: Oracle Certified Expertise with Interactive Lightbox */}
      <CertificationsGrid />

      {/* 05: Dynamic Content Pillars: Tech Notes & Reflections */}
      <ContentPillars techPosts={techPosts} lifePosts={lifePosts} />

      {/* 06: Frequently Asked Questions with Category Filter & Accordions */}
      <FAQSection />

      {/* 07: Let's Build Contact Form & Portrait Card */}
      <LetsBuildSection />
    </div>
  )
}
