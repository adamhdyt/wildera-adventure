# Graph Report - damz-projects  (2026-09-05)

## Corpus Check
- 70 files · ~687,274 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 362 nodes · 432 edges · 38 communities (22 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f644e66e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- dependencies
- post-detail.tsx
- compilerOptions
- What You Must Do When Invoked
- Product Requirements Document (PRD)
- devDependencies
- components.json
- Process
- about-intro.tsx
- graphify reference: extra exports and benchmark
- app/layout.tsx
- subscribe.ts
- graphify reference: query, path, explain
- mountain-journal.mdx
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- next.config.mjs
- about/page.tsx
- contact/page.tsx
- privacy-policy/page.tsx
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- .claude/CLAUDE.md
- reading-habit.mdx
- shipping-small.mdx
- small-town.mdx
- profiling-postgres.mdx
- react-server-components.mdx
- type-safe-data-layer.mdx
- graphify reference: extraction subagent prompt
- next-env.d.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 25 edges
2. `compilerOptions` - 16 edges
3. `getAllPosts()` - 13 edges
4. `What You Must Do When Invoked` - 12 edges
5. `/graphify` - 11 edges
6. `Product Requirements Document (PRD)` - 8 edges
7. `graphify reference: extra exports and benchmark` - 8 edges
8. `Sidebar()` - 7 edges
9. `getPostBySlug()` - 7 edges
10. `tailwind` - 6 edges

## Surprising Connections (you probably didn't know these)
- `generateStaticParams()` --calls--> `getAllPosts()`  [EXTRACTED]
  app/(blog)/life/[slug]/page.tsx → lib/mdx.ts
- `generateMetadata()` --calls--> `getPostBySlug()`  [EXTRACTED]
  app/(blog)/life/[slug]/page.tsx → lib/mdx.ts
- `LifeArticlePage()` --calls--> `getPostBySlug()`  [EXTRACTED]
  app/(blog)/life/[slug]/page.tsx → lib/mdx.ts
- `LifePage()` --calls--> `getAllPosts()`  [EXTRACTED]
  app/(blog)/life/page.tsx → lib/mdx.ts
- `generateStaticParams()` --calls--> `getAllPosts()`  [EXTRACTED]
  app/(blog)/tech/[slug]/page.tsx → lib/mdx.ts

## Import Cycles
- None detected.

## Communities (38 total, 16 thin omitted)

### Community 0 - "cn"
Cohesion: 0.09
Nodes (25): AdBanner(), AdBannerProps, AffiliateDisclosure(), BlogLayoutClient(), CodeBlock(), CopyButton(), getActiveSection(), items (+17 more)

### Community 1 - "dependencies"
Cohesion: 0.05
Nodes (41): @base-ui/react, class-variance-authority, clsx, framer-motion, @giscus/react, gray-matter, lucide-react, next (+33 more)

### Community 2 - "post-detail.tsx"
Cohesion: 0.11
Nodes (26): LifePage(), metadata, generateMetadata(), generateStaticParams(), LifeArticlePage(), metadata, TechPage(), generateMetadata() (+18 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, node_modules_old (+20 more)

### Community 4 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 5 - "Product Requirements Document (PRD)"
Cohesion: 0.08
Nodes (23): 1. Executive Summary, 1. Executive Summary, 2. User Experience & Functionality, 2. User Stories, 3. AI System Architecture, 3. AI System Requirements (If Applicable), 4. Evaluation, 4. Technical Specifications (+15 more)

### Community 6 - "devDependencies"
Cohesion: 0.08
Nodes (23): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+15 more)

### Community 7 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 8 - "Process"
Cohesion: 0.15
Nodes (12): 1. Gather context, 2. Explore the codebase (optional), 3. Draft vertical slices, 4. Quiz the user, 5. Publish the tickets to the configured tracker, Acceptance criteria, Blocked by, <NN> — <Ticket title> (+4 more)

### Community 9 - "about-intro.tsx"
Cohesion: 0.22
Nodes (7): metadata, AboutIntro(), achievements, certifications, competencies, highlights, stats

### Community 10 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 11 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): inter, jetbrainsMono, metadata, viewport, ThemeProvider()

### Community 12 - "subscribe.ts"
Cohesion: 0.40
Nodes (4): resend, subscribe(), subscribeSchema, NewsletterForm()

### Community 13 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 14 - "mountain-journal.mdx"
Cohesion: 0.50
Nodes (3): Making camp above the clouds, Photo journal, The summit push

### Community 15 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 16 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 17 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 18 - "next.config.mjs"
Cohesion: 0.50
Nodes (3): __dirname, __filename, nextConfig

## Knowledge Gaps
- **180 isolated node(s):** `metadata`, `metadata`, `metadata`, `metadata`, `metadata` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `post-detail.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.08502415458937199 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `post-detail.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1106612685560054 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._