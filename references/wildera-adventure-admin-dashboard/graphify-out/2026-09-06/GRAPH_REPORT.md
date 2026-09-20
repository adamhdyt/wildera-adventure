# Graph Report - damz-projects  (2026-09-06)

## Corpus Check
- 81 files · ~920,823 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 525 edges · 37 communities (23 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b05f587a`
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
- graphify reference: extra exports and benchmark
- app/layout.tsx
- graphify reference: query, path, explain
- mountain-journal.mdx
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- next.config.mjs
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
- 2.2 User Stories & Acceptance Criteria
- floating-pill-nav.tsx
- hero-section.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 25 edges
2. `compilerOptions` - 16 edges
3. `getAllPosts()` - 15 edges
4. `What You Must Do When Invoked` - 12 edges
5. `/graphify` - 11 edges
6. `2.2 User Stories & Acceptance Criteria` - 9 edges
7. `Post` - 8 edges
8. `Product Requirements Document (PRD)` - 8 edges
9. `graphify reference: extra exports and benchmark` - 8 edges
10. `GitHubIcon()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ContentPillarsProps` --references--> `Post`  [EXTRACTED]
  components/home/content-pillars.tsx → lib/mdx.ts
- `generateStaticParams()` --calls--> `getAllPosts()`  [EXTRACTED]
  app/(blog)/life/[slug]/page.tsx → lib/mdx.ts
- `generateMetadata()` --calls--> `getPostBySlug()`  [EXTRACTED]
  app/(blog)/life/[slug]/page.tsx → lib/mdx.ts
- `LifeArticlePage()` --calls--> `getPostBySlug()`  [EXTRACTED]
  app/(blog)/life/[slug]/page.tsx → lib/mdx.ts
- `LifePage()` --calls--> `getAllPosts()`  [EXTRACTED]
  app/(blog)/life/page.tsx → lib/mdx.ts

## Import Cycles
- None detected.

## Communities (37 total, 14 thin omitted)

### Community 0 - "cn"
Cohesion: 0.08
Nodes (30): AdBanner(), AdBannerProps, AffiliateDisclosure(), CodeBlock(), Comments(), CopyButton(), getActiveSection(), items (+22 more)

### Community 1 - "dependencies"
Cohesion: 0.05
Nodes (41): @base-ui/react, class-variance-authority, clsx, framer-motion, @giscus/react, gray-matter, lucide-react, next (+33 more)

### Community 2 - "post-detail.tsx"
Cohesion: 0.14
Nodes (20): LifePage(), metadata, generateMetadata(), generateStaticParams(), LifeArticlePage(), metadata, TechPage(), generateMetadata() (+12 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

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

### Community 10 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 11 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): inter, jetbrainsMono, metadata, viewport, ThemeProvider()

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

### Community 38 - "2.2 User Stories & Acceptance Criteria"
Cohesion: 0.07
Nodes (26): 1.1 Problem Statement, 1.2 Proposed Solution, 1.3 Success Criteria, 1. Executive Summary, 2.1 User Personas, 2.2 User Stories & Acceptance Criteria, 2.3 Non-Goals (Out of Scope), 2. User Experience & Functionality (+18 more)

### Community 39 - "floating-pill-nav.tsx"
Cohesion: 0.12
Nodes (18): subscribe(), subscribeSchema, competencies, experience, metadata, directChannels, metadata, BlogLayoutClient() (+10 more)

### Community 40 - "hero-section.tsx"
Cohesion: 0.12
Nodes (14): metadata, AboutIntro(), AboutQuoteSection(), CERTIFICATIONS_DATA, CertificationsGrid(), ContentPillars(), ContentPillarsProps, heroCards (+6 more)

## Knowledge Gaps
- **203 isolated node(s):** `metadata`, `experience`, `competencies`, `metadata`, `directChannels` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `floating-pill-nav.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `getAllPosts()` connect `post-detail.tsx` to `hero-section.tsx`, `cn`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `metadata`, `experience`, `competencies` to the rest of the system?**
  _203 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.07547169811320754 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `post-detail.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._