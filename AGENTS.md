# Engineering Agent Instructions

## Project Overview

adamwisher.com is a professional portfolio with public case studies, Ask Adam,
protected Projects, and a server-backed Admin Console. Follow the owner's Project
Instructions and the authorized task scope. Inspect current code before editing;
preserve architecture, existing data, URLs, and unrelated work.

- Stack: Next.js 15 App Router, React 19, strict TypeScript, Tailwind CSS 3,
  Framer Motion, PostgreSQL-compatible PGlite locally and Aurora RDS Data API as
  the remote adapter. Use Node.js 20 (the CI version) and the npm lockfile.
- `app/`: pages, layouts, API route handlers, public and Admin styles.
  `components/`: shared UI and `components/admin/` client panels.
- `lib/admin/`: database, auth, permissions, validation, publishing and public
  readers. `lib/knowledge/` and `data/knowledge/`: evidence-backed Ask Adam data.
- `scripts/`: explicit migration/bootstrap/import commands and integration tests;
  `tests/e2e/`: browser tests; `.github/workflows/ci.yml`: Portfolio CI.
- Detailed procedures: [Admin Console](docs/admin-console.md),
  [design implementation](docs/figma-redesign-implementation.md),
  [Figma handoff](docs/figma-desktop.md), and
  [knowledge data contract](data/knowledge/README.md). These documents contain
  historical stages/results; use the latest applicable section and verify code.
  The README's initial scaffold limitations are historical, not current setup.

## Development Workflow

Run commands from the repository root. Do not install dependencies or regenerate
the lockfile unnecessarily. Verified commands (not a claim that they have passed):

| Purpose | Command |
| --- | --- |
| Install locked dependencies | `npm ci` |
| Development server (port 3000) | `npm run dev` |
| Lint | `npm run lint` |
| TypeScript, no emit | `npm run typecheck` |
| Production build | `npm run build` |
| Serve an existing production build | `npm run start` |
| Migration regression | `node scripts/test-admin-publication.mjs` |
| Six-module publication regression | `node scripts/test-publication-runtime.mjs` |
| Data integration | `npm run test:admin-data` |
| Knowledge reconciliation | `npm run test:admin-knowledge` |
| Security integration | `npm run test:admin-security` |
| Browser acceptance | `npm run test:e2e` |
| Ask Adam evaluation (running local server) | `npm run validate:ask-adam` |

Build before the HTTP integration/browser suites. The integration scripts create
their own disposable PGlite stores; run them sequentially because their server
ports are fixed. There is no generic `npm test` script. A known historical
evaluation result is not evidence for the current commit; never weaken assertions
to obtain PASS.

Next.js loads `.env.local`, but the standalone Node scripts do not load it.
Export required variables into their process environment explicitly. Use
`.env.example` for documented variable names and the owning server module for
additional service-specific conventions; never copy actual credentials into Git.

## Next.js Architecture

- Follow `app/**/page.tsx`, `layout.tsx` and `app/api/**/route.ts` conventions.
  Route params in current dynamic handlers/pages are promises; await them.
  Preserve strict checks and the `@/*` root alias from `tsconfig.json`.
- Keep database/auth/secret access server-side. Use `"use client"` only for
  interactive boundaries, following existing panels/components. Database routes
  run on Node.js; do not move PGlite or RDS SDK work into Edge middleware.
- Admin sections use `app/admin/[section]/page.tsx` and
  `components/admin/console.tsx`. Structured modules share
  `lib/admin/module-config.ts`, `lib/admin/module-records.ts` and
  `components/admin/module-panel.tsx`; Projects/Apps use `lib/admin/records.ts`.
  Extend the existing boundaries rather than creating parallel CRUD systems.
- Reuse `components/ui/`, `lib/utils.ts`, `tailwind.config.ts`,
  `app/globals.css` and `app/liquid-glass.css`; Admin styling lives in
  `app/admin/admin.css`. Preserve the approved Figma layout, transparent glossy
  Liquid Glass controls, theme tokens, responsive behavior and accessible
  fallbacks. Do not redesign approved screens without authorization.
- Preserve semantic headings, labels, keyboard focus, modal focus handling,
  reduced motion/transparency and light/dark readability. Browser/axe coverage
  does not establish full WCAG compliance or physical iOS/Safari acceptance.
- Keep the six source-controlled case-study routes and reserved slugs intact.
  Protected `/projects` authentication is separate from Admin authentication;
  preserve `middleware.ts` and `lib/projects-auth.ts` boundaries.

## PostgreSQL & Migrations

- Schema is SQL in `lib/admin/migrations/001_init.sql` through
  `005_publication_snapshots.sql`: core records/audit, security, Apps publishing,
  structured modules, then publication snapshots. No ORM migration CLI is used.
- Run `npm run admin:migrate` only against the explicitly selected environment.
  `scripts/admin-migrate.mjs` sorts numbered SQL files, splits statements on
  semicolons, and executes each file in a transaction. It skips successful versions in `admin_schema_migrations`, pins checksums
  (including trusted legacy entries), and rejects later checksum drift.
  Ledger checks and SQL execute under a transaction and table lock. New migrations must be rerunnable and compatible with this
  parser. Do not assume procedural SQL containing semicolons will work.
- Add numbered migrations; do not rewrite applied migrations or remove data.
  Preserve IDs, relationships, provenance and audit history. Use additive,
  backwards-compatible changes and a single migration runner. Never migrate on
  requests or during builds. Back up before an authorized environment migration;
  use the recovery procedure in the Admin documentation.
- Use `store.query`/`store.transaction` from `lib/admin/db.ts` and parameterized
  values. Dynamic SQL identifiers must come from existing allowlists. Keep row
  locks, working writes, publication changes and audit writes in one transaction;
  audit/snapshot failures must roll everything back.
- Neon uses `ADMIN_DATABASE_DRIVER=neon`, TLS `ADMIN_DATABASE_URL` at runtime,
  and a direct `ADMIN_DATABASE_DIRECT_URL` for explicit CLI migrations/bootstrap.
  Missing production driver configuration fails closed on database access.
  PGlite defaults to `.data/admin-pg`; set a separate `ADMIN_DB_PATH` for tests.
  Aurora uses `ADMIN_DATABASE_DRIVER=aurora-data-api` and server-side
  `ADMIN_DB_RESOURCE_ARN`, `ADMIN_DB_SECRET_ARN`, `ADMIN_DB_NAME`, `AWS_REGION`.
  The adapter's presence is not evidence of live Aurora validation.
- For a fresh isolated review store, explicitly run `npm run admin:migrate`,
  then `npm run admin:bootstrap` with `ADMIN_BOOTSTRAP_EMAIL` and a matching
  scrypt `ADMIN_PASSWORD_HASH`. Bootstrap does not reset existing users.
  `npm run admin:import-knowledge` reconciles source records without overwriting
  Admin edits; review its differences before cutover. Legacy local import is
  `npm run admin:import-sqlite -- .data/admin.sqlite`; follow the backup/count
  checks in the Admin documentation before using it.

## Admin Console & Publishing

- The six-module snapshot runtime is implemented for Experience, Education,
  Certifications/Training, Apps (`products`), Releases and Timeline. Preserve
  `lib/admin/publication.ts` and `005_publication_snapshots.sql`. Legacy Projects
  retain their existing workflow and are **outside** this snapshot model.
- DRAFT/REVIEW saves leave approved snapshots unchanged. Explicit PUBLISHED
  promotes validated content; ARCHIVED unpublishes by removing the snapshot and
  retaining the working row. Republish row actions use persisted working data,
  not unsaved form edits. Soft deletion also removes the snapshot atomically.
  Migration backfill preserves the current legacy row, not an invented earlier
  approval; reruns must not resurrect unpublished snapshots.
- Preserve server-enforced RBAC, audit actions and Admin publication badges.
  UI writes send `updated_at`, checked under row lock; stale writes are rejected.
  Legacy tokenless partial APIs retain their compatibility behavior. Do not
  silently extend conflict guarantees to every caller.
- Public six-module readers use `publishedRows`, never mutable Admin rows;
  require PUBLIC visibility, no soft deletion, and public referenced parents.
  App metadata/listings must use the same approved representation. Keep Admin
  APIs and working previews authenticated; do not introduce public Draft APIs.
- `lib/admin/public-knowledge.ts` gates factual readers with the exact
  source-ID fingerprint in `PUBLIC_KNOWLEDGE_CUTOVER_SHA`; absent/mismatched
  fingerprints retain static sources. A configured reader failure after cutover
  must not silently substitute different content. Preserve import reconciliation
  and factual classifications; do not invent missing evidence URLs.
- `PUBLIC_CONTENT_SOURCE=database` enables the implemented flag/SEO runtime
  and related managed routes; it is not a universal gate for every database
  reader. Inspect each caller. Redirect execution additionally requires
  `PUBLIC_REDIRECTS_ENABLED=1`; preserve protected-path/loop validation.
- Snapshot routes are dynamically rendered with no cross-request snapshot cache;
  the next request observes committed state. An open page needs refresh/navigation.
  Do not add caching that breaks publication, metadata or unpublish consistency.
  Media usage checks include snapshot references.
- Stage 5.2 remains review work, not production readiness. Live Aurora,
  backup/restore and durable production media storage remain unverified or
  unfinished. Local media is not suitable for ephemeral Amplify storage;
  Aurora-mode uploads are rejected until an object-storage adapter exists.

## Playwright & QA

- `playwright.config.ts` runs `tests/e2e/` sequentially with one worker and a
  production server at `http://127.0.0.1:3100`. Build first; prevent an unrelated
  server from being reused on that port. Default coverage is Chromium, not a
  configured multi-browser project matrix.
- Fixtures/helpers are inline in `tests/e2e/admin.spec.ts`, `learning.spec.ts`
  and `publishing.spec.ts`; public flows are in `portfolio.spec.ts`. There is no
  separate fixture directory, global auth setup or shared storage-state file.
  Tests log in through the UI with `ADMIN_TEST_EMAIL` (default
  `admin@example.test`) and `ADMIN_TEST_PASSWORD` matching the bootstrap hash.
- Install the locked browser with `npx playwright install --with-deps chromium`.
  For a disposable local review database run
  `node scripts/prepare-publishing-review.mjs`; it prints a path to a private
  temporary `env.sh`. Source that exact path in your local shell, then run
  `npm run build` and `npm run test:e2e`. The helper migrates, bootstraps, imports
  reconciled knowledge and sets review cutover switches. It defaults
  `PLAYWRIGHT_EXECUTABLE_PATH` to `/usr/bin/chromium`; if using the installed
  Playwright browser, `unset PLAYWRIGHT_EXECUTABLE_PATH` after sourcing. Never
  print or commit the environment file. Stop servers before removing its temp
  directory. CI's full isolated setup is in `.github/workflows/ci.yml`.
- Browser tests mutate their review store; never use existing personal/production
  data. Use synthetic unique fixtures, clean up new fixtures, and preserve
  anonymous HTML, Draft isolation, publish/unpublish/republish, RBAC/session,
  audit, parent visibility and source-cutover acceptance.
- Preserve responsive checks at 1440/1280/768/390/320px and certification
  lifecycle captures at 390/320px light/dark. Use `testInfo.outputPath` for
  review screenshots. Failure screenshots and retained traces go to
  `test-results/`, with HTML reports in `playwright-report/`; both are ignored.
  CI uploads `admin-review-screenshots` and failure `playwright-evidence`.
- Contact browser tests intercept delivery; do not send real mail for QA.
  If browser installation/launch is blocked, report it and use exact-commit CI
  evidence; never substitute static inspection or old screenshots for a PASS.

## Security

- Use `requirePermission` and the role matrix in `lib/admin/permissions.ts` on
  the server. SUPER_ADMIN publishes/manages users/settings; EDITOR edits drafts
  and previews; READ_ONLY views without mutation or draft preview. Hidden buttons
  are not authorization. Preserve `safeMutation` origin checks and validation.
- Preserve scrypt password hashes, opaque sessions with hashed tokens, expiration,
  revocation, database login limits and last-active-Super-Admin protection.
  Never log passwords, hashes, cookies, session tokens or secret values.
- Keep environment secrets server-side; never add `NEXT_PUBLIC_` to credentials.
  Use secret references and least-privilege runtime access. Keep test credentials,
  environment files, database/media directories and private source data out of
  commits, PR bodies and screenshots. Redact sensitive diagnostic output.
- Validate URLs, paths, types, lengths, relationships and media signatures at the
  server boundary. Preserve protected redirect destinations, private media
  responses, SVG rejection and referenced-asset deletion protection.
- Follow the knowledge data contract: evidence-backed public facts only; no
  private contacts/identity aliases in retrieval context. Preserve bounded LLM
  context, validation, consent and existing Contact anti-abuse controls.
- Never change production infrastructure, data, credentials, feature flags or
  cutover switches, run production imports/migrations, merge or deploy without
  explicit authorization. Do not provision paid resources for review.

## GitHub & Release Workflow

- Use the branch and existing PR authorized by the current task. Stage 5 used
  `feature/admin-console-stage-5` and PR #10; do not treat those historical
  identifiers as authorization for later work.
  Fetch and inspect remote HEAD/status before editing and again before pushing.
  Record starting SHA; preserve concurrent commits and uncommitted work.
- Make focused commits with descriptive messages; inspect the staged diff and
  exclude generated files/secrets. If remote advances, rebase/replay only your
  changes on the latest authorized head and revalidate. Stop on unsafe conflicts.
  Never force-push, overwrite concurrent work or create a duplicate PR.
- Update the existing Draft PR with evidence without replacing concurrent
  description edits; an additive conversation comment is suitable. Keep it Draft.
  `.github/workflows/ci.yml` runs on PRs targeting `main` and pushes to `main`.
  Verify runs/checks associated with the **exact final head SHA**, including the
  PR merge-ref association where applicable, and link the run. Pending/blocked
  CI is not PASS. Main triggers production Amplify builds; do not merge to test CI.
- Treat production deployment triggers as live configuration, not a permanent
  repository fact. Main may auto-deploy through Amplify; verify read-only state
  before any separately authorized merge without deployment. Do not toggle it.

## Repository Skills

Repository guidance lives in `.agents/skills/*/SKILL.md`. File placement alone is
not proof of native ChatGPT Work discovery or activation. If the environment does
not expose these names, manually read the selected files before acting and report
that fallback honestly. Do not install personal skills or invent registration.
Project Instructions and task authorization take precedence, then this AGENTS.md,
then skill guidance. Security, data integrity and release gates always apply.

| Task | Load only relevant guidance |
| --- | --- |
| Routes, metadata, UI | `.agents/skills/nextjs-engineer/SKILL.md` |
| Persistence, migrations | `.agents/skills/postgresql-architect/SKILL.md` |
| Browser acceptance | `.agents/skills/playwright-qa/SKILL.md` |
| Auth, API or privacy review | `.agents/skills/security-auditor/SKILL.md` |
| PR, CI, release gates | `.agents/skills/release-engineer/SKILL.md` |

Add QA for observable UI/public behavior, Security for auth/privacy/data writes,
and Release for delivery. Read only selected bodies; do not load all five for
every task. Run `node scripts/validate-engineering-skills.mjs` after edits.
See [validation exercises](docs/engineering-skills-validation.md) for limits and
manual scenario evidence.

## Definition of Done

- Implement only the authorized scope; preserve public behavior, data and design.
  For implementation changes run lint, TypeScript, production build, relevant
  integration/security/publication suites and browser acceptance. Do not remove
  or weaken failing tests. For documentation-only changes, check paths, scripts,
  commands, links, Markdown, secrets and `git diff --check`; report which runtime
  suites were not rerun and why. Let exact-SHA CI establish its own results.
- Verify remote delivery, the intended Draft PR and final-SHA CI. Report PASS only
  with observed supporting evidence; distinguish local, CI, historical and
  unexecuted checks. Do not equate review success with production readiness.
- Final report: starting/final SHA, changed files and links, implemented changes,
  exact commands/results, CI status/run link, Draft PR status and remaining
  blockers. Keep it concise. Never claim merge/deployment without performing an
  explicitly authorized release.
