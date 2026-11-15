# Interactive Glass Project Folders

## Reference and scope

This implements the supplied `glass-folder-cards.tsx` reference in the homepage
Selected work section. The original 340×272 panel paths, 54px headroom, front
hinge, frosted panel, sheen/rims, cursor parallax, spring transitions, entrance and
opening document fan are retained in `components/ui/glass-folder-cards.tsx` and
its scoped CSS. The optional generated-art engine, Add/More menus, sample files,
creation callbacks and demo page are removed. There is no new public write API.

The existing heading/anchor, page background, Inter/IBM typography, three/two/one
column responsive grid, project summaries, case-study links, More work, Hero and
Ask Adam are preserved. Home now shows all six existing public case studies,
rather than a hardcoded subset of three, plus eligible managed Projects. Work
continues to use its existing ProjectCard/ProjectVisual presentation, sourced
from the same public case-study catalog.

## Public data boundary

`data/public-projects.ts` contains only the six already public source-controlled
case studies. `lib/public-projects.ts` is server-only. With the existing
`PUBLIC_CONTENT_SOURCE=database` discovery opt-in, it appends only legacy Project
rows that are PUBLISHED, PUBLIC and not soft deleted, ordered by sort_order/slug.
Reserved source-controlled slugs are deduplicated and malformed slugs are rejected.
Without that opt-in, Home renders the six public case studies without opening a
database. Configured storage failures propagate rather than silently substituting
private or different managed content.

Only title, summary, category, role, public route and public material URLs cross
the server/client boundary. Working bodies, Admin metadata, media IDs, uploads,
session data and password-protected workspace content are not serialized or
scraped for links. Publication/RBAC handlers, six-module snapshots, metadata,
canonicals and sitemap behavior are unchanged. Projects retain their existing
legacy workflow: saving DRAFT or ARCHIVED removes public eligibility; this task
does not introduce a separate Project revision model or run migrations.

## Real materials

Source-controlled folders use their existing public cover diagrams and theme
variants. Each folder links to the existing case-study route and its public cover
asset. There are no fabricated PDFs, file sizes, moodboards or private documents.
Managed Projects have no cover/upload/material fields in the current schema; their
cover and second material reuse the existing published `/og?path=/work/{slug}`
overview image. This provides a real publicly accessible image without exposing
private uploads or requiring new content fields. Additional approved documents or
custom managed covers would need a separate explicit public-material data model.
Repository privacy does not authorize publishing GitHub/raw file links; none are
added to the homepage.

## Interaction, accessibility and performance

- Native disclosure button supports click/tap, Enter and Space, aria-expanded and
  aria-controls. Escape closes and restores focus; outside pointer presses close.
- Closed documents are inert, aria-hidden and excluded from keyboard navigation.
  Open documents are real links. Their exposed headers are pointer/touch targets
  in the supplied stacked geometry; the ordinary case-study CTA remains an
  independent 44px navigation target below each folder.
- Full project titles remain visible in semantic headings below the folder,
  even when the front-panel title uses the supplied ellipsis treatment.
- ResizeObserver scales the original geometry to the available card width.
  A 24px mobile inset reserves room for the rotated fan at narrow widths; the
  aspect-ratio reserves layout space. Assets have dimensions, lazy loading
  and asynchronous decoding. Existing light/dark theme classes control artwork
  and ink without theme hydration state or per-card theme observers.
- Pointer updates are requestAnimationFrame-bounded, touch ignores parallax,
  reduced motion suppresses animation/parallax, and effects clean up listeners,
  timers and observers. Reduced-transparency/unsupported-filter fallbacks preserve
  legibility. Document labels use contrasting surfaces against real artwork.
- No new dependency, runtime noise-field/canvas generation, permanent will-change
  layer or duplicated inline stylesheet is added. The build reports roughly
  118kB first-load Home JavaScript; this is not a production Core Web Vitals claim.

## Acceptance and commands

Run `npm run lint`, `npm run typecheck`, `npm run build`,
`node scripts/validate-engineering-skills.mjs`,
`node scripts/test-public-projects.mjs`,
`node scripts/test-project-folders-http.mjs`,
`node scripts/test-admin-publication.mjs`,
`node scripts/test-publication-runtime.mjs`,
`node scripts/test-seo.mjs`, `node scripts/test-seo-http.mjs`,
`npm run test:admin-data`, `npm run test:admin-knowledge`,
`npm run test:admin-security`, and `npm run test:e2e`.

Catalog/HTTP tests cover assets, ordering, default static independence, publication,
visibility, deletion, reserved/malformed slugs, private-field exclusion, real
public materials, protected-route rejection and immediate eligibility changes.
New Chromium tests cover 1440/1280/768/390/320px, both themes, actual loaded covers,
open-folder axe checks, keyboard/document navigation, touch, reduced motion, no
public writes and the actual Admin publish/Draft lifecycle with anonymous HTML
privacy assertions. Existing Home assertions now require all six folders and
loaded real covers; the former three-card count is intentionally updated rather
than removed. No unrelated assertion is weakened or test removed.

Screenshots use testInfo.outputPath with `admin-glass-folders-*` names and are
included in CI's existing review artifact. Browser PASS requires exact-head CI
where the local execution environment cannot launch Chromium. Do not claim
physical iPhone/Safari testing or full WCAG conformance from automated checks.

No merge, deployment, production data change, feature-flag change, infrastructure
operation or Amplify Auto Build change is part of this task. Repository Next.js,
Playwright, Security and Release skill bodies were manually loaded; native skill
discovery/installation is not claimed.
