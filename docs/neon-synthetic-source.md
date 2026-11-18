# PR #14 synthetic recovery source

The owner observed three 17-table schemas in `integration-review/neondb`.
The control plane identifies the review branch as a parent-data branch. Fixture
names and table counts cannot establish provenance. The earlier conditional
51-table manifest is stopped. Do not connect the recovery runtime to `neondb`.

## Source decision

| Option | Assessment |
| --- | --- |
| New database on the existing review branch | Preferred if an owner review can establish isolation. Create only `recovery_synthetic_source_pr14_7955d1df` with explicit `TEMPLATE template0`. This retains the exact reviewed direct endpoint and runner egress. A PostgreSQL role is branch-wide, and PUBLIC grants may extend into existing databases. |
| New schema-only branch | Fits the observed 3 of 10 branch slots, subject to runtime usage. It copies schema definitions, so still create the source database from `template0`; stop if the control plane cannot prove data-free creation. Prefer a verified empty non-production parent. A new endpoint and branch ID change the DNS, CIDRs, runner ownership and artifact/approval bindings. This fallback needs a new package. |

Do not create the branch or database in this review. The existing target must
remain independently empty until an approved restore.

## Single setup approval

Review [the exact manifest](neon-synthetic-source-approval.json) and verify its
SHA-256 with `sha256sum docs/neon-synthetic-source-approval.json`. This is a
combined setup and metadata preflight approval package. Live recovery still requires the existing
explicit approval of the observed runtime fingerprint.

1. Verify the exact PR head and its CI, account, project/branch identities,
   stack ownership, vault properties and key VersionId/stage. Check native DNS
   against the full reviewed sets, exact hostaddr pins, SSM, AMI and bootstrap
   attestation. Instance `i-0841611e524956db8` terminated at expiry on
   November 18, 2026. Its runner stack still requires cleanup. The previous
   setup digest is expired. Plan exactly one replacement from the checked-in
   template with an explicit owner-reviewed UTC expiry within eight hours of
   provisioning, and sufficient time for the operator. Before any mutation,
   review the exact controller fingerprints, private ownership receipts,
   native DNS answer sets, current AMI, and updated aggregate cost. The
   $2 planning allowance for the replacement leaves room under the existing
   cumulative $5 ceiling, subject to verified actual or conservative costs.
   Use the controller's failure cleanup for the exact expired stack and
   verify absence before launching the replacement.
2. From the private DBA channel, review effective privileges from catalog
   metadata only. PostgreSQL roles are shared across databases on a branch.
   Review inherited and PUBLIC privileges for connectable existing databases:
   schema USAGE, relation and column access, callable user routines and indirect
   access such as security-definer functions or foreign objects. Abort if the
   intended bare role could reach existing records or if the inventory is
   incomplete. Do not change ACLs on existing databases to make this pass.
3. Use owner SQL with `TEMPLATE template0`; verify the new database name/OID,
   owner, pristine catalog and absence of inherited application schemas. Use
   the normal migration engine against only the new DB, record all five ledger
   checksums, and apply the pinned fixture SQL. Do not import site data or real
   credentials. Record the creation command, trusted operator/time, branch and
   database identifiers, empty-before catalog evidence and artifact SHA.
4. Reproduce schema and row reference fingerprints in a disposable PostgreSQL
   18 database built independently from the same migration and fixture bytes.
   Use the pinned PostgreSQL clients, UTC, and the same encoding/collation.
   The runner calls `core.schema_digest` and
   `scope.rows_digest(core.fingerprint(...))`. Pin those independent values
   and SHA-256 of the reviewed provenance receipt under `synthetic_scope`.
   A source-derived digest alone is insufficient.
5. Use SCRAM, no memberships or elevated role flags, and grant the named
   reader only CONNECT to the new database, USAGE on its public schema, and
   SELECT on the 17 exact tables. Remove PUBLIC CONNECT/TEMP and unneeded
   PUBLIC schema privileges on the new database only, as needed for these
   effective rights. Validate the existing target owner with the same
   checks. Source connection limit is 2, target is 1. Both login expiries
   must be no later than runner expiration.
6. Bind the reviewed passing commit's new source archive by immutable S3
   VersionId and SHA-256; the previously installed artifact has the old
   unrestricted dump path. Install side by side and attest the exact entry
   points before configuring secrets. No IAM, networking or KMS changes
   are needed beyond the reviewed replacement template if the existing pins
   hold. Stop if broader rights are needed. Set exactly one config version
   in the new stack's secret, using the approved private owner interface,
   and pin its unique RECOVERY stage. The provisioning plan must bind
   `retained_key_version` to the retained version. Preserve the vault's run
   ID for ownership and use a clean runner receipt without initializer
   fields. Reuse the existing key version and unique stage, verify effective
   IAM denies writes to it, and bind instance identity to the replacement
   stack resource. No initializer stack is needed. The new archive path
   includes the replacement stack ID digest to avoid reusing an old key.
7. Run catalog-only preflight. It rejects legacy plans, validates exact
   endpoint/database/role bindings and compares the 17-table inventory and
   normalized DDL with the reference. It does not fingerprint application
   rows. Present the resulting runtime fingerprint for live recovery approval.
   During approved recovery, the runner verifies DDL and expected row
   fingerprint on the same repeatable-read exported snapshot before any
   upload, then dumps only the 17 allowlisted `public` tables, excluding large objects. The existing
   encrypted, versioned archive and transactional restore checks remain.
8. On abort, completion or expiry, disable both dedicated logins, clear
   passwords, terminate only their sessions and verify there are none. Revoke
   the temporary source grants. Do not delete a database or any existing
   schema. Keep the owner-side configuration credentials private. Preserve
   the existing vault and immutable key. Verify runner stack deletion separately
   from scheduled EC2 termination.

See [PostgreSQL template databases](https://www.postgresql.org/docs/18/manage-ag-templatedbs.html),
[pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html),
[Neon branching](https://neon.com/docs/introduction/branching) and
[Neon plans](https://neon.com/docs/introduction/plans).
