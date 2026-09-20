import Link from "next/link"
import Image from "next/image"
import { CodeBlock } from "@/components/blog/code-block"
import { ScriptSearch } from "@/components/blog/script-search"

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return node.toString()
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (node && typeof node === "object" && "props" in node && (node as any).props.children) {
    return extractText((node as any).props.children)
  }
  return ""
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
}

export const mdxComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mt-12 mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => {
    const id = slugify(extractText(children))
    return (
      <h2 id={id} className="mt-10 mb-4 text-2xl font-semibold tracking-tight text-foreground scroll-m-20">
        {children}
      </h2>
    )
  },
  h3: ({ children }: { children: React.ReactNode }) => {
    const id = slugify(extractText(children))
    return (
      <h3 id={id} className="mt-8 mb-4 text-xl font-semibold tracking-tight text-foreground scroll-m-20">
        {children}
      </h3>
    )
  },
  p: ({ children }: { children: React.ReactNode }) => (
    <div className="mb-6 leading-relaxed text-muted-foreground">
      {children}
    </div>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => {
    const isInternal = href && (href.startsWith("/") || href.startsWith("#"))
    if (isInternal) {
      return (
        <Link href={href} className="font-medium text-primary underline underline-offset-4 decoration-primary/30 transition-colors hover:decoration-primary">
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-4 decoration-primary/30 transition-colors hover:decoration-primary"
      >
        {children}
      </a>
    )
  },
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-6 ml-6 list-outside list-disc space-y-2 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-6 ml-6 list-outside list-decimal space-y-2 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="my-8 border-l-4 border-primary/50 bg-primary/5 py-3 pl-6 pr-4 italic text-foreground">
      {children}
    </blockquote>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null
    return (
      <figure className="my-8 overflow-hidden rounded-xl border border-border bg-muted/20">
        <div className="relative flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ""}
            className="h-auto max-h-[750px] w-auto max-w-full object-contain"
            loading="lazy"
          />
        </div>
        {alt && (
          <figcaption className="border-t border-border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            {alt}
          </figcaption>
        )}
      </figure>
    )
  },
  // We handle pre/code blocks with our custom CodeBlock component
  pre: ({ children, ...props }: any) => {
    // next-mdx-remote passes the code element inside the pre element
    const codeProps = children?.props || {}
    const className = codeProps.className || ""
    const lang = className.replace("language-", "") || "text"
    const code = codeProps.children || ""

    // Trim trailing newline from code block if present
    const cleanCode = typeof code === "string" ? code.replace(/\n$/, "") : code

    return <CodeBlock code={cleanCode} lang={lang} />
  },
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
      {children}
    </code>
  ),
  ScriptSearch,
  Script: ({ title, category, children }: { title: string; category: string; children: React.ReactNode }) => (
    <section className="script-item mb-12" data-category={category}>
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {category}
        </span>
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      {children}
    </section>
  ),
}

