# adamwisher.com — foundation

## 1. Pre-implementation inspection (as requested in step 1)

There is **no existing project in this environment**. This sandbox started
empty except for a static HTML prototype from an earlier step in this
conversation (not a Next.js app, no framework, no repo). So, concretely:

| Item | Finding |
|---|---|
| Framework | None found — created from scratch |
| Next.js Router | N/A → set up as **App Router** |
| TypeScript | N/A → configured fresh |
| Tailwind CSS | N/A → configured fresh |
| shadcn/ui | Not initialized — **could not run the shadcn CLI** (no network access in this sandbox, see §3). Hand-wrote a small `Button` in shadcn's conventions as a stand-in. |
| `/components/ui` | Did not exist → created |
| `/lib/utils.ts` | Did not exist → created (`cn()` via `clsx` + `tailwind-merge`) |
| Spline / framer-motion | Not installed → added to `package.json` (not installed, see §3) |
| Routing | None → `app/page.tsx` only; `/work`, `/visuals`, `/learning`, `/about`, `/contact` are linked from nav but not yet created as routes |

If this is meant to layer onto a real existing repo you have elsewhere, this
package wasn't able to see it — point me at the repo (upload it, or connect
a code host) and I'll redo this as a diff against the real project instead
of a from-scratch scaffold.

## 2. What was built

```
app/
  layout.tsx            fonts, metadata, dark theme
  page.tsx               homepage: Hero + SelectedWork
  globals.css
  api/ask-adam/route.ts  server-side stub (see §4)
components/
  ui/
    spline-scene.tsx     exact filename/content per spec
    spotlight.tsx        mouse-reactive glow, stable handler refs
    button.tsx            shadcn-style primitive
  home/
    hero.tsx
    hero-navigation.tsx
    hero-robot.tsx
    ask-adam.tsx
    selected-work.tsx
  work/
    project-card.tsx      typed, reusable across the 5 future case studies
lib/utils.ts
types/ask-adam.ts
.env.example
tailwind.config.ts / postcss.config.js / next.config.mjs / tsconfig.json
```

### Design decisions
- Dark-first palette exactly as specified (`#050505` background, `#F4F4F5` /
  `#A1A1AA` text, `rgba(255,255,255,0.10)` borders) as Tailwind theme tokens
  rather than hardcoded hex in components.
- Hero is a 45/55 grid at `lg:`, collapsing to a single column below that,
  with the mobile stacking order from the spec applied via CSS `order`
  utilities (identity/headline → intro → expertise → Ask Adam → nav →
  robot) rather than duplicating markup.
- `SplineScene` is lazy-loaded (`lazy()` + `Suspense`) so it never blocks
  the text hero from rendering; `Spotlight` sits behind it as a separate
  absolutely-positioned layer.
- Ask Adam already threads a `history` array through its request payload
  (unused by the stub today) so conversation history can be turned on
  server-side later without a frontend change.

### Content honesty
Per your instruction, nothing was invented. Case studies are five
`PROJECT 0N` shells with a `TODO` badge and no summaries. GitHub, LinkedIn,
and contact links are `#` placeholders marked `TODO`. No employers, dates,
metrics, or certifications appear anywhere.

## 3. Important limitation — please read

This sandbox has **no network access** (`npm install` and the shadcn CLI
both fail — I confirmed the registry is unreachable here). That means I
could not:

- run `npm install` to actually pull down Next.js, React, Tailwind, Spline,
  or framer-motion,
- run `npx shadcn-ui init` / `add`,
- run `npm run lint` or `npm run build`,
- or verify this compiles.

I wrote every file by hand against the current stable APIs for Next.js 14
App Router / React 18 / Tailwind 3, so it should install and build cleanly
in a normal environment, but **I have not been able to prove that** the way
step 20/21 asks for. Please run, in your own environment:

```
npm install
npm run lint
npm run build
```

and send me the output — I'll fix anything that surfaces.

## 4. Ask Adam / `/api/ask-adam` status

Frontend is fully wired: input state, submit state, loading state, error
state, suggested questions, Enter-to-submit, accessible labels, and a
response thread — all live in `components/home/ask-adam.tsx` and POST to
`/api/ask-adam`.

The route now queries a structured, evidence-backed knowledge base in
`data/knowledge`, retrieves only the most relevant public records, and returns
an answer. It works without an external database or AI provider. When the
optional `ASK_ADAM_LLM_*` server variables in `.env.example` are configured,
the route passes only bounded retrieved context to an OpenAI-compatible chat
endpoint. Provider failures fall back to an extractive answer.

Private contact details and identity aliases are excluded from the repository.
AWS CLF-C02 courses are labeled as certification preparation, not an AWS
certification. See `data/knowledge/README.md` for the data contract and
maintenance rules.

## 5. Production-readiness pass (this update)

I attempted `npm install` again in this sandbox and it still fails the same
way as before: `403 Forbidden` from `registry.npmjs.org`. This environment
has no outbound network access, so I genuinely cannot run `npm install`,
`npm run lint`, `npm run build`, or start a dev server here — there is no
`next` binary, so there is nothing to lint, build, or serve, and no browser
runtime here to inspect a rendered page in either case.

What I did instead, since I couldn't run the real tools:

- Re-ran `npm install` to confirm the failure is unchanged (still `E403` on
  the registry — not something fixed by anything in this codebase).
- Did a manual type/syntax pass with the TypeScript compiler that is
  available in this sandbox, filtering out the errors that are pure fallout
  from `@types/react`/`@types/node` not being installed (e.g. "Cannot find
  module 'react'", "'key' does not exist" from missing JSX typings). No
  genuine syntax errors turned up.
- Grepped for the lint issues that are easy to miss and that
  `eslint-config-next` (`react/no-unescaped-entities`, `@next/next/no-img-element`,
  `react/jsx-no-target-blank`) would flag — none found; the one `<img>` tag
  already carries its `eslint-disable` since it's genuinely a plain image,
  not a `next/image` candidate here.
- Manually audited every interactive element for `focus-ring` coverage and
  confirmed all of them have it (inputs, nav links, chips, buttons, the
  project card link).

**Issues found and fixed:**

1. **Dead CSS class.** `SplineScene`'s `Suspense` fallback referenced a
   `.loader` class that was never defined — it was silently rendering
   nothing while the scene loaded. Added a real spinner in
   `app/globals.css`; it inherits the existing `prefers-reduced-motion`
   override, so it correctly stops animating for users who ask for reduced
   motion.
2. **Anti-pattern:** `key` was being passed inside a JSX spread
   (`<ProjectCard key={...} {...project} />`) in `selected-work.tsx`. Not
   a runtime bug, but it's the kind of thing that produces confusing
   TypeScript errors and is easy to get wrong later — replaced with
   explicit props.
3. **Chat log a11y.** Ask Adam's message thread was a plain
   `aria-live="polite"` div, which re-announces the *entire* history to
   screen readers on every new message. Changed the wrapper to
   `role="log"` with `aria-relevant="additions"` so only new messages are
   announced — the standard pattern for chat-style logs.

**Files changed:** `app/globals.css`, `components/home/ask-adam.tsx`,
`components/home/selected-work.tsx`.

**What I could not validate, and why:** everything that requires an actual
build or a browser — Spline scene loading, console errors, hydration
errors, layout shift, the desktop/tablet/mobile breakpoints, the live
`POST /api/ask-adam` round trip, and real keyboard/focus behavior in a
running page. None of that is observable from static source review. To
close this out for real:

```
npm install
npm run lint
npm run build
npm run dev
```

then open the homepage and walk the checklist in your message (Spline
load, console, hydration, layout shift, the three breakpoints, Ask Adam
input/chips/loading/error states, tab order and focus rings, and reduced
motion). Send me whatever `lint`/`build` output or console errors you see
and I'll fix them directly — I'd rather fix real errors from a real run
than guess at ones that might not exist.

## 7. Static QA pass (this update — no live browser available)

Same limitation as before, stated plainly: this sandbox has no browser and
no network, so I cannot open a real page, resize a viewport, read the
console, or hit `/api/ask-adam` over HTTP. "Builds locally" means on your
machine, not this one — I have no way to reach it. Rather than invent a
QA report, here's exactly what is and isn't checkable from source alone.

**Verified true, from code (no browser needed for these):**
- Spline is genuinely lazy-loaded: `lazy(() => import('@splinetool/react-spline'))`
  inside a `Suspense` boundary scoped to `SplineScene` only.
- Hero headline and Ask Adam are siblings of `HeroRobot` in `hero.tsx`, not
  descendants of the `Suspense` fallback — so page content is not gated on
  Spline finishing.
- The robot container has a fixed height per breakpoint
  (`h-[280px] sm:h-[420px] lg:h-[640px]`) independent of load state, so
  there's no height jump between the loading fallback and the loaded
  scene — CLS from Spline is structurally prevented.
- Heading hierarchy is clean: one `h1`, `h2`s for Ask Adam and Selected
  work, `h3` for project titles — no skipped levels.
- External links (GitHub, LinkedIn) both carry `rel="noopener noreferrer"`.
- Computed contrast ratios against the `#050505` background: body text
  ~19:1, `--text-secondary` (#A1A1AA) ~8:1, the error-red (#F87171) ~7.4:1,
  the accent focus ring (#3B82F6) ~5.5:1 — all clear AA, most clear AAA.

**One real issue found and fixed:** `HeroRobot`'s wrapper `div` had an
`aria-label` with no accessible role, so screen readers weren't guaranteed
to expose that label (a generic `div` doesn't get a name from `aria-label`
without a role backing it). Added `role="region"` alongside the existing
label.

**Cannot be verified without a live browser — genuinely unknown until you
run it:** actual Spline scene load/console/hydration behavior, real layout
at live viewport widths, `/api/ask-adam` over an actual HTTP round trip,
real focus-ring rendering, and real reduced-motion behavior in an actual
OS/browser. If you can paste console output, a screenshot, or describe
what you're seeing at a given width, I can act on that directly instead of
me guessing.

**Files changed:** `components/home/hero-robot.tsx`.

**Lint/build result:** not run — still no network, no `next` binary
installed in this sandbox (confirmed again, same `E403`).

## 8. Remaining TODOs

- Real bio/case-study content for `/work`, `/visuals`, `/learning`, `/about`
- Real GitHub/LinkedIn/contact links
- `/api/ask-adam` → Bedrock + knowledge base integration
- Route stubs for `/work`, `/visuals`, `/learning`, `/about`, `/contact`
- Run shadcn CLI once you have network, to replace/extend the hand-written
  `Button` with generated primitives if you want full shadcn parity
- Verify `npm install` / `lint` / `build` in a real environment (see §3)
