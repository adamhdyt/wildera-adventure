import { codeToHtml } from "shiki"
import { CopyButton } from "@/components/blog/copy-button"

export async function CodeBlock({
  code,
  lang = "text",
}: {
  code: string
  lang?: string
}) {
  // We use dual themes for smooth light/dark mode transitions
  const html = await codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  })

  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-border bg-secondary/30">
      {/* Language Badge */}
      <div className="absolute left-4 top-0 -translate-y-px rounded-b-md border border-t-0 border-border bg-muted/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-md">
        {lang}
      </div>

      <CopyButton code={code} />

      {/* 
        We inject the dangerouslySetInnerHTML inside a div so we can style the <pre> tag Shiki generates.
        Shiki generates dual-theme variables when defaultColor is false.
      */}
      <div
        className="[&>pre]:overflow-x-auto [&>pre]:p-5 [&>pre]:pt-10 [&>pre]:text-[13px] [&>pre]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
