---
name: nextjs-engineer
description: Implement or review Next.js App Router pages, route handlers, metadata, UI, accessibility, and performance in adamwisher.com. Use for frontend, server rendering, SEO, and public/Admin application changes.
---
# Next.js Engineering — adamwisher.com

Read repository-root `AGENTS.md`, current task scope, and relevant existing code before edits. This skill supplements, never overrides, Project Instructions.

## Inspect
1. Confirm branch, HEAD, relevant `app/`, `components/`, `lib/`, and existing tests.
2. Trace data from route/handler to server reader and rendered output; identify server/client boundaries and feature flags.
3. For design work, consult approved Figma and `docs/figma-redesign-implementation.md`; preserve Liquid Glass tokens, responsiveness, and accessible focus.

## Implement
- Follow Next.js 15 App Router and React 19 conventions; await dynamic route params where required.
- Keep secrets, authentication, database access and authorization server-side. Do not move PGlite/Aurora code into Edge or client bundles.
- Reuse module configuration, UI components and design tokens; avoid duplicate CRUD or CSS systems.
- Public six-module content must come from approved snapshots, not mutable Admin working rows; retain source-matched cutover and protected route boundaries.
- For SEO, derive metadata, canonical URLs, robots, Open Graph, and sitemap only from publicly eligible content; prevent draft leaks and stale caching.
- Validate inputs and links; handle empty states and errors without inventing content.

## Verify
Run `npm run lint`, `npm run typecheck`, `npm run build`, relevant integration scripts, and `npm run test:e2e` with isolated fixtures. Test anonymous HTML, HTTP responses, light/dark and 1440/1280/768/390/320px when applicable. Report exact command outcomes, SHA and CI; never infer browser PASS from a build.
