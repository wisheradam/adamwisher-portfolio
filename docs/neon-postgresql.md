# Neon PostgreSQL Free integration

## Status and transport

Repository implementation only. No Neon account/project, production secret, Admin account,
AWS configuration, production migration or deployment was created or changed.
Live Neon acceptance requires an explicitly isolated development database. Contract tests
use injected clients; PostgreSQL CI proves SQL compatibility, not Neon network behavior.

Use `ADMIN_DATABASE_DRIVER=neon`. Runtime `ADMIN_DATABASE_URL` should be the console's
pooled PostgreSQL URL. `ADMIN_DATABASE_DIRECT_URL` is a direct endpoint for migrations
and bootstrap only. Both must use a `.neon.tech` host and `sslmode=require` or
`verify-full`; credentials never use NEXT_PUBLIC variables. URL validation errors do
not include supplied values. The WebSocket transport uses verified WSS; do not disable
certificate verification. The driver and ws dependency support the Node 20 CI runtime.

The existing callback transaction API makes decisions after SELECT/FOR UPDATE. It
cannot be replaced with a batch of independent HTTP queries. Each operation creates
one Neon Client; each interactive transaction binds all queries to that client and
executes BEGIN/COMMIT/ROLLBACK. Connections close in finally, including failed connects.
No idle pool or timers keep compute awake. Connection timeout is 15 seconds, database
statement timeout 30 seconds, client query timeout 35 seconds. No write or COMMIT is
automatically retried: connection loss during commit has an ambiguous result and callers
must reread persisted state. No adapter is connected until a query is requested.

Production without an explicit driver fails on database access, never silently creates
PGlite. Explicit PGlite remains available for isolated production-build tests. Aurora's
runtime transaction behavior is retained. CLI local import tools reject remote drivers.

## Migrations and bootstrap

`npm run admin:migrate` is an explicit operation, never a request/build hook. All five
historical SQL files remain unchanged. The common engine locks the ledger, checks the
version, applies pending SQL and records its checksum in one transaction per file.
Completed files are skipped. Failed files and their ledger entries roll back; a rerun
resumes at the failed version. Later files do not run after failure. Changed known
checksums fail. Legacy applied entries without checksums are trusted and pinned to the
current reviewed file; this cannot prove their historical SQL content. Reconcile schema
before adopting an unknown legacy ledger. An additive checksum column is the only
ledger schema change. Keep a single migration runner; simultaneous first-time creation
of an entirely absent ledger is not a supported bootstrap strategy. Existing SQL uses
semicolon-separated statements; procedural SQL needs a reviewed parser change.

Neon bootstrap uses the direct endpoint and locks admin_users before checking emptiness.
It preserves existing users. Set ADMIN_BOOTSTRAP_EMAIL and a unique scrypt
ADMIN_PASSWORD_HASH only in the trusted one-off runner; never in browser config or PRs.
Do not execute bootstrap until the source-data inventory and owner authorization exist.
Do not distribute passwords in logs. Existing database-backed opaque sessions, server
RBAC, origin checks, audit transactions and six-module publication snapshots are retained.
Projects still use their documented legacy workflow; no Project snapshots are invented.

## Free-plan budget (researched November 15, 2026)

Official source: https://neon.com/docs/introduction/plans
Driver: https://neon.com/docs/serverless/serverless-driver
Pooling: https://neon.com/docs/connect/connection-pooling

Current Free allowance: 100 CU-hours per project per month, 1 GB database storage per
project (20 GB account total), 5 GB public transfer per project, 10 branches per project,
compute up to 2 CU, suspension after five minutes, one day monitoring, restore history
up to six hours capped at 1 GB changes, and one manual snapshot. No uptime SLA. Check
console allowances before cutover because plans change. Free is a constrained hosting
choice, not a guarantee of uninterrupted production service. No automatic paid upgrade.
At 0.25 CU continuously active, 730 hours costs 182.5 CU-hours: request traffic that
prevents sleep can exhaust Free. Public database cutover therefore needs usage review.

Check compute/storage/transfer in the Neon Console weekly and before imports/releases.
Do not add periodic SELECT health checks, frontend polling, keepalive queries or a cron
that defeats suspension. Existing opt-in public readers/cutover switches remain unchanged;
without cutover, source-controlled content stays independent of Neon. Runtime Admin queries
remain dynamic; do not cache drafts, permissions or snapshots across requests. Large
media belongs outside PostgreSQL. Trim expired sessions/login-limit rows only via a
separately reviewed retention job; do not delete audit records to make quota room.

## Isolated acceptance

CI runs the complete existing PGlite HTTP/security/browser suites, new adapter contract
checks, migration recovery checks and a disposable PostgreSQL 18 service compatibility /
logical export-restore check. It does not use a production Neon secret.

For live development acceptance create a Free project, select an EU region, and create
an isolated `integration-review` branch/database with synthetic data only. Supply its URL
through a trusted environment/secret facility, never chat or a committed env file.
Run `NEON_TEST_ISOLATED=1 node scripts/test-postgres-integration.mjs` with
NEON_TEST_DATABASE_URL set securely. It creates a randomly named schema, migrates and
tests only that schema, then drops it. It must never be pointed at production. Follow
with a separately approved staging UI run using temporary credentials and that branch.
A valid credential alone is not proof the target is safe; the operator must verify it.

## Recovery before cutover

The domain-associated Amplify app discovered in review is d1kl8c118pp04s/eu-north-1,
not the legacy Frankfurt app. Inspect both deployments and all owner-held local exports.
No surviving runtime PGlite content was accessible from this workspace. Missing RDS is
not proof of no users, drafts, projects or audit history. Do not initialize over unknown data.

Inventory source-controlled data, SQLite/PGlite directories, uploaded files, historical
exports and snapshots. Stop writes before copying a PGlite directory; preserve an untouched
copy and checksum manifest. Export from a copy in an isolated workstation, count every
table, reconcile IDs/relationships/users/roles/publications/audits, and record source-ID
fingerprints. Transfer through a reviewed parameterized import; existing knowledge import
is local-only and must not silently overwrite editorial changes. Sessions can contain
personal/security data: preserve/export securely and decide explicit revocation policy.

Independent backup process proposal: use a trusted runner with pg_dump and the direct
Neon endpoint; produce a custom-format dump (no password in command arguments), encrypt
it outside Neon, record SHA-256, source endpoint identity, time, schema version, row counts
and object-version manifest. Set PG* credentials through the secret facility, not shell
history. Keep daily backups for 14 days and pre-migration backups; this is a proposal,
not an installed scheduler. A daily dump gives up to 24-hour independent-backup RPO;
the short Neon restore window covers only recent mistakes. No stronger RPO is promised.

Rehearse pg_restore into a NEW isolated database, run migrations, compare counts/sample
hashes, inspect FK/orphans and publication snapshots, test authentication/RBAC/public HTML,
and fetch sample private/public media. Time the procedure; target RTO four hours until
measured. CI additionally restores a consistent logical synthetic export to a separate
PGlite engine; that is not a pg_dump or live Neon disaster-recovery drill. Keep database
dumps, password hashes and session exports encrypted and out of Git and CI artifacts.

Cutover sequence: inventory -> independent backup -> isolated restore -> owner-reviewed
reconciliation -> reviewed pending migrations -> secure bootstrap only if genuinely empty
-> staging UI/security/Neon acceptance -> exact-SHA CI -> separate approval for Amplify
runtime configuration/deployment -> smoke/monitor -> approve factual cutover separately.
Rollback code/configuration without deleting new data; reconcile writes before switching
backends. Never down-migrate or recreate a database to recover.

## Media proposal (not provisioned)

Preserve current source-controlled covers and public navigation. Neon and Aurora fail
closed with 503 for local upload/media operations until durable storage is implemented.
Use a dedicated private S3 bucket, Block Public Access, TLS, encryption and versioning.
Scope runtime object permissions to the designated prefix. Continue server-side size,
MIME/extension/signature validation and authenticated upload controls. Use immutable
random object keys; commit metadata/audit after object upload, clean orphaned objects
later, retain old versions until reference and retention checks pass. Do not put binary
media or temporary uploads in Neon.

Private/Draft/protected files require authenticated delivery. A future public file endpoint
must verify a currently published eligible reference on each request; bucket membership
is not publication. Signed links expire but remain usable until expiry, so use server
streaming if immediate unpublish revocation matters. No public bucket policy or permanent
public object URL is proposed. This task does not add a public media CMS feature.

## Production configuration and remaining gates

After separate approval, configure the actual Stockholm SSR runtime (not only build env)
with ADMIN_DATABASE_DRIVER=neon and the server-side runtime URL. Do not ship direct
migration credentials to runtime. Validate secret delivery without printing values; no
Neon IAM policy is required. Preserve protected Projects secrets/contact permissions.
Do not change PUBLIC_CONTENT_SOURCE, PUBLIC_KNOWLEDGE_CUTOVER_SHA or redirect switches
until explicit data reconciliation approves them. Auto Build was observed enabled on the
actual domain app; do not merge until the release owner resolves deployment triggering.

Remaining gates: owner Neon project connection, live Neon/staging UI and cold-start tests,
source recovery inventory, independent pg_dump restore drill, S3 integration/provisioning,
production environment delivery and separate release approval. Nothing here upgrades a
plan, changes AWS, creates Admin users or deploys production.

## Live isolated review — November 15, 2026

Neon MCP access verified for project shy-breeze-43898017. Production branch
br-summer-bird-b915xsws was not queried or changed. Created integration-review
(br-wispy-darkness-b91vydbj) with Free-plan defaults after an explicit suspend
timeout was rejected. PostgreSQL reports 18.7 (180007).

Using Neon SQL API transactions only in integration_acceptance: all five historical
migration SQL files created 17 tables and five ledger entries. A failed transaction
rolled back both a CREATE TABLE and INSERT. Synthetic working Draft v2 retained
published v1; an invalid audit write rolled back its accompanying content update.
Exported the synthetic working row, snapshot and audit together in one SQL statement,
then restored them into a separate PGlite engine and verified all three. Backup stays
in ignored local .data, not Git. This is a synthetic logical restore, not a pg_dump
disaster-recovery drill. SQL API execution is not a test of the CLI migration engine;
its skip/checksum/recovery regressions run locally and in CI.

Direct WebSocket-driver acceptance failed in this workspace (no successful handshake).
The first attempt revealed that Client.end could wait forever after a failed connection;
cleanup is now bounded to two seconds and has a regression test. No write is retried.
Live application-driver, HTTP RBAC/authentication and cold-start acceptance remain
blocked by transport availability here. Existing isolated HTTP RBAC/security and
PostgreSQL publication suites remain required, but are not called live Neon results.
No production bootstrap, media provisioning, plan upgrade, merge or deployment occurred.
