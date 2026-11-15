---
name: postgresql-architect
description: Design and review PostgreSQL-compatible PGlite and Aurora Data API persistence, migrations, transactional publishing, integrity constraints, and recovery for adamwisher.com.
---
# PostgreSQL Architecture — adamwisher.com

Read `AGENTS.md`, `docs/admin-console.md`, `lib/admin/db.ts`, migration runner and existing SQL before changing persistence.

## Inspect
1. Identify driver and environment; never assume local PGlite behavior proves live Aurora compatibility.
2. Trace schema, foreign keys, indexes, audit records, snapshots, row locks, and readers for affected entities.
3. Confirm applied migration numbering; migrations `001`–`005` are historical and must not be rewritten.

## Implement
- Add numbered, additive, backwards-compatible SQL migrations only when needed.
- `scripts/admin-migrate.mjs` replays SQL and splits on semicolons: design migrations to be rerunnable and parser-compatible; do not assume ledger-based skipping.
- Parameterize values; allowlist dynamic identifiers. Preserve IDs, provenance, relationships, historical data, and audit records.
- Use `store.transaction` for working writes, snapshot promotion/removal, audit writes and related integrity checks; ensure failures roll back all effects.
- Preserve Draft/Published isolation, optimistic conflict tokens, parent visibility, source-matched cutover, and snapshot media references.
- Never run migrations against production or modify production data without separate explicit authorization and backup/recovery plan.

## Verify
Run `npm run admin:migrate` only on a disposable explicitly selected test database, `node scripts/test-admin-publication.mjs`, `node scripts/test-publication-runtime.mjs`, relevant integrations and browser acceptance. Exercise repeat migrations, constraint failures, rollback, stale writes, publish/unpublish/republish, and anonymous privacy. Report driver/environment, exact results and Aurora gaps.
