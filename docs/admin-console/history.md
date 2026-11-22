# Development history and verification

[Handbook](README.md) · [Operations](operations.md)

## Merged milestones

These entries describe the changes on GitHub. Actions runs are evidence for the
listed PR revisions and test environments.

| PR | Merged UTC | Milestone | CI evidence |
| --- | --- | --- | --- |
| [#8](https://github.com/wisheradam/adamwisher-portfolio/pull/8) | 2026-11-13 | First Admin Console, protected editing, previews, explicit publish and audit | [#64](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/43409167409) passed |
| [#9](https://github.com/wisheradam/adamwisher-portfolio/pull/9) | 2026-11-14 | PGlite/Aurora Data API layer, migration, SQLite import, transactional writes and Stage 4 browser checks | [#69](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/43615766217) passed |
| [#10](https://github.com/wisheradam/adamwisher-portfolio/pull/10) | 2026-11-15 | Stage 5 RBAC, persistent sessions, users, modules and Stage 5.2 publication/runtime work | [#91](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/43691338910) passed |
| [#11](https://github.com/wisheradam/adamwisher-portfolio/pull/11) | 2026-11-15 | Repository engineering guidance and skill checks | [Validation notes](../engineering-skills-validation.md) |
| [#12](https://github.com/wisheradam/adamwisher-portfolio/pull/12) | 2026-11-15 | Published-only SEO eligibility, social metadata and sitemap checks | [SEO guide](../seo.md) |
| [#13](https://github.com/wisheradam/adamwisher-portfolio/pull/13), [#15](https://github.com/wisheradam/adamwisher-portfolio/pull/15) | 2026-11-15 / 2026-11-16 | Public Work uses glass folders with static case studies. The follow-up keeps Work usable without a database cutover. | [#103 for PR #15](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/43761913689) passed |

Read the [historical stage notes](../admin-console.md) for original constraints
and checkpoint detail. Stage 1 authentication and the earliest descriptions of
the Admin menu are superseded by the implementation described in this handbook.

## Open work

Checked on November 22, 2026.

| Draft PR and head | Implemented evidence | Outstanding gates |
| --- | --- | --- |
| [#14 · Neon/PostgreSQL](https://github.com/wisheradam/adamwisher-portfolio/pull/14) · `28e7eefb3d5c3786da395a0a2570b8c7853a9339` | [Exact-head CI #129](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/44359108115) passed the disposable PostgreSQL/age recovery checks, nine owner-inspector tests and 59 browser tests. Reviewed [operator evidence](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-6986241009) records local libpq 16.15 checks. | Live target catalog inspection and permission-restoration evidence are pending in the recorded discussion. Prior Neon connection probes are not full runtime acceptance. Cumulative cost coverage, runner replacement review, live recovery, provenance/reconciliation and production activation remain open. |
| [#16 · private S3 media](https://github.com/wisheradam/adamwisher-portfolio/pull/16) · `24aa5f61b8d79ab3189d2537271f5b7c2e05e165` | [Exact-head CI #106](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/43767413951) passed on that PR revision. | Stacked on the Neon branch. Reconcile with current base and rerun gates before release. Production bucket, least-privilege permissions, media import and live delivery/recovery acceptance are unverified. |

GitHub source and CI are separate from observed Amplify job 57. Neither draft
branch is part of that deployment. In particular, the recovery vault is separate
from the proposed portfolio upload bucket.

## Engineering checks

Use [the main workflow](../../.github/workflows/ci.yml) to reproduce lint,
TypeScript, build, migration/publication regressions, local Admin data and security
tests, knowledge reconciliation, SEO HTTP checks and Playwright Chromium.
The workflow seeds a disposable database, bootstraps a test user and uses
synthetic data. Browser coverage on Chromium does not prove Safari or real-device
support. Database adapter mocks and SQL compatibility checks do not prove live
Neon or Aurora behavior.

Record the candidate SHA, expected deploy trigger, exact CI job, test data scope,
rollback plan and live acceptance before approving a release. Check Admin role
boundaries, direct public URLs, sitemap and metadata, draft isolation, media
access, data persistence and restore. Recheck Amplify automatic builds and the
approved database and media configuration before any merge.
