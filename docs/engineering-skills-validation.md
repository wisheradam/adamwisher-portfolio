# Engineering skills validation — 15 November 2026

Baseline: `e5bbe81caca43b8a63b838de748ace8ee908efc4`, branch
`docs/engineering-agent-skills`, existing Draft PR #11. This record describes
manual read-and-apply exercises, not a blind evaluation or native activation.
No simulated feature, migration, merge or deployment was implemented.

## Discovery and precedence

All five SKILL.md bodies were explicitly loaded from the repository before these
exercises. The current Work executor skills catalog was inspected and paginated;
none of these five names was exposed. Native auto-discovery/invocation is therefore
**NOT DEMONSTRATED**. Valid frontmatter and file placement are insufficient proof.
No personal installation or unsupported registration configuration was introduced.
AGENTS.md supplies a repository-local manual loading fallback and task routing.
Project Instructions and current task authorization take precedence, then
AGENTS.md, then individual skills; no selection can bypass security/data/release
gates. Future environments must re-check their actual discovery capability.

## Controlled practical exercises

These are observed outputs from applying the loaded guidance to source inspection.
PASS below means the stated manual planning/review criterion was satisfied; it
never means a native skill was activated or a simulated implementation shipped.

| Test / selected skill | Files inspected | Observed output / decision | Manual criterion |
| --- | --- | --- | --- |
| A: public SEO / Next.js | `app/about/page.tsx`, `lib/admin/public-seo.ts`, `app/apps/[slug]/page.tsx` | Reuse server `generateMetadata(): Promise<Metadata>` and `publicSeo` with existing defaults; await dynamic params; preserve database switch and canonical validation. For App metadata use approved snapshots, not Admin rows. Validate static defaults and managed title/canonical/robots/Open Graph plus anonymous Draft exclusion. No UI redesign or implementation authorized. | PASS: repository-compatible implementation/validation plan |
| B: additive snapshot migration / PostgreSQL | `scripts/admin-migrate.mjs`, `lib/admin/db.ts`, `lib/admin/module-records.ts`, `lib/admin/publication.ts`, `lib/admin/migrations/005_publication_snapshots.sql` | Add a new numbered file only if needed; preserve applied files/IDs/history. Runner replays SQL and splits semicolons. Keep working write, snapshot and audit in the same transaction, row locks and updated_at checks. Test rerun/no resurrection, constraint failure rollback, stale tokens and parent privacy using publication scripts. Tokenless legacy APIs are an exception, not universal concurrency protection. No SQL created. | PASS: migration, rollback and preservation constraints identified |
| C: lifecycle acceptance / Playwright | `playwright.config.ts`, `scripts/prepare-publishing-review.mjs`, `tests/e2e/publishing.spec.ts` | Existing inline helpers bootstrap an isolated store and UI login. Create Draft; publish v1; edit/save v2; refresh and assert public v1 via anonymous rendered page and HTTP HTML; publish persisted v2; unpublish; republish; check audit and finally cleanup. Capture certification 390/320 light/dark via testInfo.outputPath; record actual browser counts/traces. No new browser outcome claimed by this planning exercise. | PASS: executable existing scenario/evidence mapping |
| D: Admin endpoint audit / Security | `app/api/admin/modules/[module]/[id]/route.ts`, `lib/admin/auth.ts`, `lib/admin/permissions.ts`, `lib/admin/module-records.ts` | PATCH requires content.edit or module-specific permission, safeMutation origin, then content.publish for PUBLISHED/ARCHIVED. Session lookup checks hash, expiry, active user and version. Verify anonymous 401, Editor publish/unpublish 403, Read Only mutation 403, revoked sessions, transaction/audit rollback and absence of working Draft in public HTML/metadata. Do not infer auth from buttons. | PASS: enforcement and negative-test boundaries traced |
| E: merge without deployment / Release | `.github/workflows/ci.yml`, AGENTS.md and read-only live Amplify branch configuration | CI targets PRs/main; green tests do not authorize merge/deploy. Read-only AWS observation by the reviewing agent on 2026-11-15: adamwisher-site main in eu-north-1 had enableAutoBuild=true, activeJobId=0000000053. Historical disabled claim was unsafe and removed. BLOCK merge-without-deploy while automatic deployment can occur; obtain separately authorized isolation before any future merge. No setting changed and no merge attempted. | PASS: safe refusal; actual merge BLOCKED |

Native activation remains NOT DEMONSTRATED for A–E. Source inspection and human/
agent reasoning do not measure whether another agent will independently select or
follow a skill. CI regression execution validates the repository, not native skill
routing. No live Aurora or physical Safari/iPhone acceptance is established.

## Cross-skill manual orchestration exercises

For each combination, the loaded bodies were compared and applied to the same
scenario boundaries. These are manual consistency checks, not multi-agent trials.

| Combination | Application and conflict resolution | Result |
| --- | --- | --- |
| Next.js + QA | SEO plan from A followed by anonymous metadata/Draft assertions from C; build before isolated real browser run. Preserve design tokens and accessibility. | PASS, manual |
| PostgreSQL + Security | B's single transaction includes D's authorized actor/audit; authentication failure cannot promote a snapshot. Preserve tokenless legacy compatibility explicitly. | PASS, manual |
| Next.js + PostgreSQL + Security | Public route reads snapshot after committed authorized promotion; no mutable Admin data in metadata and no cross-request stale snapshot cache. | PASS, manual |
| QA + Release | Browser evidence belongs to the exact final head/PR merge ref; old screenshots or green base CI cannot pass a new commit. Green QA grants no deployment permission. | PASS, manual |
| All five / hypothetical release | Select feature owners, validate transaction/privacy, then anonymous real-browser acceptance and exact-SHA CI. Stop at Draft PR unless separately authorized; E's live auto-build risk blocks a hypothetical merge-without-deploy. | PASS, manual; merge BLOCKED |

## Automated maintenance checks

Run `node scripts/validate-engineering-skills.mjs` from the repository root.
It validates exactly five expected directories, unique matching names, descriptions,
precedence mentions, actionable headings/completion sections, existing inline path
references and npm scripts, basic Markdown formatting and known credential patterns.
Frontmatter intentionally uses a restricted valid YAML subset: JSON-quoted string
scalars for name and description only. Unsupported YAML constructs fail closed;
this is not a general YAML parser or a comprehensive secret/security scan.
Six negative controls reject malformed/unquoted metadata, missing description,
duplicate metadata keys, missing paths and missing npm scripts. CI runs the same dependency-free command before lint. Semantic agreement,
activation quality, external configuration and non-inline prose references still
require review; keyword checks are not behavioral evidence.

The delivery PR comment records actual local command results and exact-final-SHA
CI evidence. No historical test counts in this file are presented as current PASS.
