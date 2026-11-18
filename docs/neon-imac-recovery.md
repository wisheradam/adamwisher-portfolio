# iMac recovery preparation — execution not approved

This is a proposed local procedure for PR #14. **Do not run `rehearse` until the
owner has reviewed the iMac environment, source/target mapping, permissions and
passing preflight, and explicitly approved execution.** Preparation is authorized;
backup/restore execution is not authorized by this document.

Use only the existing `integration-review` branch in project
`shy-breeze-43898017` as source. Never substitute production. The source endpoint
pin in the script must match the Neon Console. Target must be a separately verified,
new, empty, non-production Neon branch in the same project, on Free, with a dedicated
non-administrator restore role. This procedure does not provision it or change IAM,
database roles, project settings, production or cutover switches.

## 1. Check the iMac first — no database connection

Open a local Terminal in your checked-out PR #14 repository. Do not use Work, a
remote session, a screen recording, shell tracing, or CI. Execute commands separately:

```bash
sw_vers
uname -m
python3 --version
python3 scripts/neon-macos-recovery.py environment
```

The script requires macOS, a normal local user, FileVault enabled, 5 GiB free space,
Python 3, PostgreSQL **18** `psql`/`pg_dump`/`pg_restore`, and `age` on PATH. It installs
nothing. If a tool or permission is missing, STOP and review an installation suitable
for the actual macOS/CPU. The older iMac may not support current client packages;
do not force an unsupported installer or disable security controls. Do not run a local
PostgreSQL service just to obtain client tools.

Report only `ENVIRONMENT_PASS` or the fixed STOP message and non-sensitive tool/OS
versions. No credentials are needed for this first step. The iMac has not been verified
from Work; Linux offline tests are not macOS acceptance.

## 2. Owner-controlled local prerequisites

Before connection preflight, verify in Neon Console that the source/target branch IDs
and endpoints match the approved plan. The script checks pins and excludes the known
production branch, but cannot independently prove the Console branch-to-endpoint mapping.
Record that verification for owner review. Pause all writers on **integration-review**
for the rehearsal; never pause or modify production. Sequence values are not MVCC data.

Use narrowly scoped roles:

- Source: CONNECT, schema USAGE and SELECT on every required table and sequence;
  no ownership, CREATE, DML, elevated Neon membership or RLS bypass. A dedicated
  read-only role may use `pg_read_all_data` only after scope review. Missing read
  access must fail, never produce an incomplete success report.
- Target: dedicated non-administrator owner/CREATE privileges only in the isolated
  target database; no application traffic, no existing relations, no production access.
- The default `neondb_owner`/Neon administrator role is intentionally rejected.

Obtain/configure these permissions using your existing trusted local administration
workflow. Do not paste passwords or URLs into chat, command arguments, shell history,
Git, screenshots, logs or a CI secret/artifact. Do not change production permissions.

Create a private local configuration directory outside the repository and all synced
folders. Do not overwrite existing files:

```bash
umask 077
mkdir -p "$HOME/.config/adamwisher-neon-recovery"
chmod 700 "$HOME/.config/adamwisher-neon-recovery"
```

Use a trusted **local** editor to create three mode-600 files there:

1. `pg_service.conf`: two minimal libpq services with `host`, `port=5432`, `dbname`,
   `user`, `sslmode=verify-full`, `sslrootcert=system` and optionally `channel_binding=require`. No password,
   options, URI, service defaults, pooled host or custom proxy. Use direct endpoints.
2. `pgpass`: exactly two narrowly scoped `host:5432:database:user:password` entries,
   one per service. No wildcards. Escape libpq special characters as required.
   Libpq reads it locally; the script never prints it. Keep separate from the repo.
3. `plan.json`, using the non-secret structure below. Replace local paths and target
   details **locally**, without sharing file contents. Source endpoint is pinned to
   `ep-morning-dew-b97in9dm`; a changed source pin requires review, not a workaround.

```json
{
  "source_branch": "br-wispy-darkness-b91vydbj",
  "target_branch": "br-REPLACE-WITH-VERIFIED-RESTORE-BRANCH",
  "target_endpoint": "ep-REPLACE-WITH-VERIFIED-DIRECT-ENDPOINT",
  "source_service": "integration_review_readonly",
  "target_service": "isolated_restore_owner",
  "service_file": "/Users/LOCAL-USER/.config/adamwisher-neon-recovery/pg_service.conf",
  "pass_file": "/Users/LOCAL-USER/.config/adamwisher-neon-recovery/pgpass",
  "identity_file": "/Users/LOCAL-USER/.config/adamwisher-neon-recovery/identity.age",
  "recipient": "age1REPLACE-WITH-PUBLIC-RECIPIENT"
}
```

Generate a dedicated passphrase-encrypted recovery identity locally, if a reviewed
one is not already available. Never run this with tracing or terminal recording.
`age-keygen` emits the **public** recipient on stderr; only that public recipient
belongs in the plan. The private identity streams directly into encryption:

```bash
set -o pipefail
age-keygen | age -p -o "$HOME/.config/adamwisher-neon-recovery/identity.age"
chmod 600 "$HOME/.config/adamwisher-neon-recovery/identity.age"
```

Choose/retain the identity passphrase in your trusted local password manager.
Do not put it in an environment variable, argument, file in Git, or chat. This command
must not overwrite an existing identity. Keep identity/passfile outside temporary
backup storage and out of cloud synchronization; agree on independent key retention.

Confirm Terminal privacy, endpoint protection, FileVault, local key handling, macOS
support, no unapproved sync/backup capture, and intended data retention manually.
The script cannot attest these organizational properties or secure-erasure behavior
on APFS/SSDs. Encryption and avoiding plaintext files are the protection; unlinking
is not claimed to physically erase every copy.

## 3. Connection and key preflight — still no backup

```bash
python3 scripts/neon-macos-recovery.py preflight \
  --config "$HOME/.config/adamwisher-neon-recovery/plan.json"
```

The script checks protected files, exact endpoint pins, verified TLS, source read-only
permissions, PostgreSQL 18, readable relations, an empty restore target, and an age
key round trip using a harmless marker. Passphrases are entered only at the iMac TTY.
No database record values are retrieved. RLS tables, foreign tables and large objects
stop this procedure pending an expanded reviewed plan. SQL/application data is never
printed. Its only success output is a plan fingerprint and prerequisite status.

**STOP HERE.** Review only non-sensitive evidence with the owner and obtain explicit
approval for that fingerprint. Never interpret a passing preflight as execution approval.
Any changed endpoint, role, configuration or failed check requires a fresh review.

## 4. After separate approval only — encrypted isolated rehearsal

This command is provided for later execution. **Do not run it now.**

```bash
python3 scripts/neon-macos-recovery.py rehearse \
  --config "$HOME/.config/adamwisher-neon-recovery/plan.json" \
  --approval APPROVED-PREFLIGHT-FINGERPRINT
```

A fresh preflight must match the approved fingerprint. A second explicit local TTY
confirmation is required. The script:

- Holds a read-only exported snapshot on the source, then obtains per-table ordered
  SHA-256 consistency digests and a normalized schema digest without printing values.
- Streams one full logical database `pg_dump -Fc` directly into age encryption in a
  mode-700 local FileVault-protected cache directory. There is no plaintext dump file.
- Decrypts into `pg_restore --list` to authenticate and validate the encrypted archive
  before target writes. Every pipeline exit code is checked. Client errors that might
  contain record values are suppressed. Only age's local TTY prompts are visible.
- Rechecks target emptiness, then streams decryption to `pg_restore --single-transaction
  --exit-on-error`. It does not use `--clean`, disable triggers, or touch the source.
- Compares all ordinary/materialized-table digests (including authentication/session,
  audit and every migration ledger), normalized schema and sequence state. No record,
  role, table name, plaintext digest or client error is included in the report.
- Removes the temporary encrypted archive directory on success or failure and verifies
  its absence. The protected identity/credential files are preserved separately.

The logical dump includes all database schemas/data supported by this preflight, not
cluster-global roles or tablespaces. Ownership/ACL replay is intentionally excluded to
avoid restoring source privileges; target permissions need separate review. This is a
one-time rehearsal, not a retained disaster-recovery backup or scheduled backup service.
An interruption such as power loss/SIGKILL can prevent automatic cleanup: before any
retry, inspect the private cache directory **locally**, remove abandoned encrypted
rehearsal directories only after confirming no process is using them, and verify absence.
Never upload them for diagnosis. Target contents are retained for further isolated
validation; failure requires quarantining the target. A failed network response during
commit may have an unknown outcome; do not blindly retry against a nonempty target.

## 5. Evidence and completion gates

Only report the fixed status/boolean summary: preflight approval fingerprint, client
major version, consistency/schema/sequence outcomes, tables checked, elapsed time and
verified temporary cleanup. Do not share any private configuration or database file.
Matching full-table digests checks the ledger and audit contents, not only their counts.
Do not replay migrations to make a failed recovery appear successful.

After restore, independently validate pending migration status/checksums without applying
changes, authenticate only in the isolated app, and exercise RBAC/session expiry/revocation,
publication isolation and audit rollback. Those application tests are **not performed by
this script**. Explicitly approve target disposal/credential revocation through the trusted
administration workflow afterward. No production readiness PASS until these steps and
production-source reconciliation are complete.

## Preparation validation and references

Offline tests validate plan guards and a fail-closed non-macOS check only. No backup,
Neon access or iMac preflight was executed while preparing this procedure.

- PostgreSQL 18 [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html),
  [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html),
  [SQL dumps](https://www.postgresql.org/docs/18/backup-dump.html).
- Official [age manual](https://github.com/FiloSottile/age/blob/main/doc/age.1.ronn).
- Neon [connection pooling](https://neon.com/docs/connect/connection-pooling), and
  the installed official Neon/Neon Postgres guidance.
