# Testing and release evidence

[Handbook](README.md) · [Operations](operations.md) · [Development history](history.md)

## Reproduce the main workflow

Use Node.js 20 and the tracked npm lockfile. Run the commands from the repository
root. The [workflow](../../.github/workflows/ci.yml) runs on pushes to main and PRs
targeting main. Its browser job uses a disposable PGlite database, synthetic
credentials and a matching knowledge-source fingerprint.

| Check | Command | Coverage and environment |
| --- | --- | --- |
| Dependencies | `npm ci` | Install the locked dependency tree |
| Engineering guidance | `node scripts/validate-engineering-skills.mjs` | Instruction paths, structure, precedence and negative controls |
| Static analysis and build | `npm run lint`, `npm run typecheck`, `npm run build` | Next.js lint, TypeScript and the production build |
| Migration and publication | `node scripts/test-admin-publication.mjs`, then `node scripts/test-publication-runtime.mjs` | Disposable SQL migration reruns, snapshot privacy, conflicts, and transactional rollback |
| Public eligibility | `node scripts/test-public-projects.mjs`, then `node scripts/test-project-folders-http.mjs` | Catalog policy and HTTP eligibility, including the static fallback |
| SEO | `node scripts/test-seo.mjs`, then `node scripts/test-seo-http.mjs` | Metadata, sitemap, social images, request handling and protected paths |
| Admin server | `npm run test:admin-data`, `npm run test:admin-knowledge`, then `npm run test:admin-security` | CRUD, audit, reconciliation, sessions, roles, request-origin and privacy checks |
| Browser | `npm run test:e2e` after the isolated setup below | Admin and public flows in Chromium with the built Next.js application |

Build before HTTP and browser tests. Run the HTTP integration scripts
sequentially because some use fixed ports. Preserve the generated fixture
directory until the browser tests finish, then stop the server and remove it.

For browser tests, install the pinned Chromium through
`npx playwright install --with-deps chromium` on the Linux CI environment.
Run `node scripts/prepare-publishing-review.mjs`, source the private fixture
environment path it prints and run `npm run build` followed by
`npm run test:e2e`. With Playwright-managed Chromium, unset
`PLAYWRIGHT_EXECUTABLE_PATH` after sourcing. Check that port 3100 belongs to the
intended process. The fixture setup migrates and seeds a disposable review store.
Keep the generated credentials and environment file private.
[Browser configuration](../../playwright.config.ts) · [Test sources](../../tests/e2e)

Use responsive ranges and theme combinations asserted by the specs. Publication
reviews include mobile widths and light/dark checks. Accessibility checks exercise
automated rules and interactive behavior where specified. Chromium and automated
accessibility results leave Safari, physical-device and full accessibility
acceptance open. CI retains the selected Admin screenshots and failure evidence.

## Neon and recovery draft tests

Run these from the reviewed [PR #14 checkout and workflow](https://github.com/wisheradam/adamwisher-portfolio/blob/28e7eefb3d5c3786da395a0a2570b8c7853a9339/.github/workflows/ci.yml).
The scripts and additional PostgreSQL 18 service configuration belong to the draft.

- `node scripts/test-neon-adapter.mjs` and
  `node scripts/test-migration-engine.mjs` cover adapter contracts and migration
  replay, checksums and transaction recovery. Adapter doubles simulate transport.
- `node scripts/test-postgres-integration.mjs` and
  `node scripts/test-publication-runtime.mjs` use the disposable PostgreSQL 18
  service with `TEST_POSTGRES_URL` defined as in the draft workflow. The runtime
  suite also runs against PGlite. Use only synthetic database contents.
- `node scripts/test-encrypted-content-restore.mjs` covers the limited
  encrypted synthetic-content path. The separate EC2 recovery tests cover
  CloudFormation schema and Guard, ownership, DNS pins, launcher and version
  binding, synthetic inventory, and cleanup failure. Follow the draft workflow
  for Docker, age and the isolated test services.
- `python3 scripts/test-neon-catalog-inspect.py` exercises the inspector against
  the disposable service. `python3 scripts/test-ec2-e2e.py` uses the draft
  workflow's PostgreSQL container and real dump/restore/age tools with simulated
  AWS. Review [recovery evidence](recovery.md#hardware-vault-and-test-evidence)
  for what was run live and what remains open.

## Release evidence

Record the tested head SHA, PR and base, CI run, dataset and service boundaries.
A failed, skipped or pending step remains open for that revision. Verify the
latest Amplify release trigger and follow the
[release procedure](operations.md#release-and-rollback) before an approved merge.
