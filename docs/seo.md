# Stage 5.2 Checkpoint 3 — SEO

## Route policy

`lib/seo/public-pages.ts` resolves eligible routes before any SEO override is
consulted. It is shared by page metadata, sitemap discovery, and social images.
The eleven source-controlled public pages (Home, About, Education, Work, Contact
and six existing case studies) retain their approved copy in `lib/seo/site.ts`.
There are no new content/detail routes for individual learning or Experience rows.

Managed Apps use approved `publication_snapshots` via `publishedRows`, including
metadata descriptions and social images. Draft changes to titles, summaries,
visibility or slugs do not change the approved metadata. Changelogs require a
published public App and at least one eligible published Release. History requires
its existing runtime cutover, enabled flag and an eligible published event; related
parent visibility is enforced by the existing snapshot reader. Disabled Apps are
excluded from SEO discovery and receive noindex metadata, without changing the
existing direct App route access behavior. Existing legacy managed Projects retain
their separate workflow: only PUBLISHED/PUBLIC/nondeleted rows are eligible.

`PUBLIC_CONTENT_SOURCE=database` enables managed sitemap discovery and existing
Admin SEO overrides. Without that opt-in the sitemap lists source-controlled
routes only, without initializing or querying a database. Direct App/legacy
Project routes retain their existing data dependencies and visibility contracts.
The knowledge cutover fingerprint and static fallback remain unchanged. Database
errors after explicit cutover remain errors; they never silently substitute
unpublished content or fabricate a successful empty reconciliation.

## Metadata and canonical URLs

Every eligible public route supplies title, description, one canonical, Open Graph
website/title/description/URL/site name/locale/image and a Twitter large-image
card with matching social copy. The fixed origin is `https://adamwisher.com`.
Incoming Host/forwarded headers, tracking parameters and fragments never control
canonical URLs. The home canonical and sitemap entry use the origin without a
trailing slash, matching Next.js normalization; Admin still accepts the equivalent
legacy slash form for backwards compatibility. Existing canonical validation remains in place; output also
constructs the canonical from the eligible route instead of trusting stored URLs.
SEO title/description overrides and distinct OG copy remain supported. An existing
indexable=false rule excludes the URL from the sitemap and adds noindex to page
metadata. Metadata for private, unknown and unpublished routes cannot be made
public by adding an SEO rule for that path.

Public routes with mutable SEO settings are dynamically rendered. This extends
request rendering to Home, Contact and the source-controlled case studies; the
previous Home 300-second ISR setting is superseded so Admin SEO changes are
observable on the next request. Static JS/CSS/fonts/assets retain their normal
cache behavior. No database query or migration is run during the production build.

## Social images

`/og?path=<eligible route>` generates a real 1200×630 PNG using Next ImageResponse.
Copy comes from the approved public representation and current SEO overrides,
never arbitrary title/description/URL request parameters. Paths are bounded and
allowlisted by route resolution. Private/missing/unpublished paths return 404.
Images use no-store to prevent an old shared image being served after unpublish;
in-flight requests and already downloaded external platform previews cannot be
recalled. An external social platform can independently cache a previous preview.
Generated cards use the existing pale blue/white visual palette and accurate text.
The image renderer expands the unsupported numero glyph to “No.”; HTML metadata
retains the approved original title.
They do not expose private Admin media endpoints or depend on unfinished durable
production media storage. Uploaded OG media selection is outside this generated
card implementation; private media IDs are not published by this feature.

## Sitemap and robots

`app/sitemap.ts` emits absolute, deduplicated public URLs and optional lastModified
from approved snapshot payload timestamps (legacy Projects use their public row).
Draft timestamps do not advance public lastModified. Source-controlled entries
omit fabricated modification dates. The dynamic sitemap is no-store and reflects
publish/unpublish, parent visibility, flags, deletion and noindex rules on the next
request. Canonical aliases, private/auth/API utilities, image-generation endpoints
and missing routes are not sitemap entries.

`app/robots.ts` serves robots.txt with the canonical sitemap location. Admin,
Projects, mail, API and the Learning redirect alias are excluded from crawling.
HTTP X-Robots-Tag guards these paths, including redirects, APIs and authenticated
previews. Admin/Projects layouts and Mail metadata also use noindex; private routes
have no canonical or social metadata. OG images are fetchable by social crawlers,
with their own HTTP noindex. Robots directives are not authentication; all existing
server authorization, CSRF/origin checks and RBAC remain mandatory and unchanged.
No production flags or infrastructure are changed by this implementation.

## Validation

Use a built production server and disposable local PGlite stores only:

- `node scripts/validate-engineering-skills.mjs`
- `npm run lint`, `npm run typecheck`, `npm run build`
- `node scripts/test-admin-publication.mjs`
- `node scripts/test-publication-runtime.mjs`
- `node scripts/test-seo.mjs` (eligibility policy and failure behavior)
- `node scripts/test-seo-http.mjs` (real HTTP metadata/PNG/headers/consistency)
- `npm run test:admin-data`, `npm run test:admin-knowledge`, `npm run test:admin-security`
- `npm run test:e2e` (all existing suites plus `tests/e2e/seo.spec.ts`)

SEO browser coverage checks every source-controlled route, the existing SEO form,
actual App create/publish/Draft save/publish/unpublish/republish, metadata changes,
noindex overrides, tracking-free canonicals, stable Draft sitemap timestamps,
related changelogs/History, legacy Project metadata, private and disabled records,
HTTP robots protections, and real PNG dimensions. Existing six-module publication,
RBAC/session, responsive and accessibility regressions remain intact. CI must be
verified on the exact final branch SHA; a build is not browser acceptance.

No schema migration is required. All five repository engineering skill files were
manually read for this task; their presence is not a claim of native discovery.
Live Aurora, production media, redirects/performance, broad visual QA and release
rollout remain separate stages. No merge, deployment, production data operation or
Amplify Auto Build change is authorized by this task.
