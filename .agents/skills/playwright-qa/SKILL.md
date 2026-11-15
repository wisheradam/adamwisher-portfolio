---
name: "playwright-qa"
description: "Plan, implement and execute Playwright browser acceptance and regression tests for adamwisher.com, including publishing, security, responsive UI, and visual evidence."
---
# Playwright QA — adamwisher.com

Read `AGENTS.md`, `playwright.config.ts`, `tests/e2e/`, and CI workflow before editing tests.

Follow Project Instructions and AGENTS.md over this skill; preserve task authorization and release restrictions.

## Prepare
- Use isolated disposable PGlite with synthetic data. Never point E2E at personal or production stores.
- Follow `scripts/prepare-publishing-review.mjs` for local setup, or the explicit CI bootstrap/migration/import sequence. Fixtures and login helpers are inline in tests/e2e files. Source the private env.sh without printing it; unset PLAYWRIGHT_EXECUTABLE_PATH when using Playwright-managed Chromium instead of the helper default /usr/bin/chromium.
- Build before tests; confirm port 3100 is not serving an unrelated process. Chromium is the configured CI browser; do not claim Safari/Firefox coverage.
- Keep authentication fixtures and secrets out of logs and committed artifacts.

## Cover
- Admin UI create/save/refresh; publish v1; save Draft v2; verify anonymous public v1; publish v2; unpublish; republish; clean fixtures.
- RBAC denial, session revocation, CSRF/origin checks, anonymous APIs, audit records, related parent visibility, metadata and listing consistency.
- Source-matched cutover ON/OFF, fallback, missing evidence/media, conflict handling and no stale cache.
- Responsive widths 1440, 1280, 768, 390 and 320px, light/dark, keyboard/focus, and reduced motion where relevant.
- Assert actual rendered HTML and network behavior, not only UI labels or mocked backend output.

## Evidence
Run `npm run test:e2e` after lint/typecheck/build and relevant integration checks. Use `testInfo.outputPath` for screenshots; retain traces on failure. Never skip, weaken or delete a failing test to obtain PASS. Report exact passed/failed/skipped counts, browser/environment, artifacts and final-SHA CI URL. If local Chromium is unavailable, state that and rely only on independently verified CI evidence.
