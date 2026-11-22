# Neon recovery rehearsal

[Handbook](README.md) · [Infrastructure](operations.md#backup-and-recovery) · [Status and roadmap](status.md)

[Draft PR #14](https://github.com/wisheradam/adamwisher-portfolio/pull/14) holds the
Neon adapter and recovery tooling. The rehearsal is an isolated synthetic exercise.
The inspection milestone is complete. The live backup, restore, application
acceptance and production cutover remain open.

## November 22 owner inspection

| Evidence | Reviewed value |
| --- | --- |
| Recorded at | November 22, 2026, 07:03:22 UTC |
| Neon project | `shy-breeze-43898017` |
| Branch | `integration-restore-pr14-7955d1df` |
| Database and PostgreSQL OID | `recovery_pr14_7955d1df`, `17796` |
| Database owner | `recovery_restore_pr14_7955d1df` |
| Inspector implementation | [`28e7eefb3d5c3786da395a0a2570b8c7853a9339`](https://github.com/wisheradam/adamwisher-portfolio/commit/28e7eefb3d5c3786da395a0a2570b8c7853a9339) |
| Reviewed scope digest | `6ad843189e650af38304d00fdafa7ffa67902be60e05eead2b9bb8127cd17be1` |

The owner reported a successful read-only target-local inspection. Inventory
matched the approved empty baseline. The target contained only schema `public`
and extension `plpgsql`, with zero user relations, routines, types or large
objects and no migration ledger. The original ACL and role memberships were
restored. A fresh inspector connection was denied, no inspector target sessions
remained, and the owner remained NOLOGIN. The later read-only maintenance check
corroborated the ACL, membership, effective denial and session count. The
timestamp and target-local inventory are owner evidence. [Scope review](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-6982056828) ·
[November 22 preflight](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-7076068313)

## Temporary CONNECT procedure

In the approved private environment the wrapper checks its SQL digests, exact
database identity and ACL baseline. The operator and cleanup channels authenticate
separately against the exact maintenance database. A detached watchdog demonstrates
it can observe the same baseline from another authenticated backend. The wrapper
serializes operators, grants only the short-lived CONNECT privilege and opens one
read-only target session. Temporary role delegation is removed within the same
transaction that grants CONNECT. The cleanup channel revokes CONNECT immediately
after the handshake. The held session can then read the target-local catalogs.
The wrapper checks membership and ACL restoration, denial of a fresh connection,
and session closure. It emits aggregate evidence only.

The watchdog can revoke during timeout or parent-process loss. Destruction of
the operator environment can disable both local cleanup paths, so an independent
owner channel must remain available. Treat any uncertain grant or cleanup as
an incident and reconcile the original ACL, memberships and sessions before
closing it. The approved procedure binds a direct endpoint, TLS hostname
verification and exact target. Keep credentials and operational material in the
private channel. [Reviewed inspector runbook](https://github.com/wisheradam/adamwisher-portfolio/blob/28e7eefb3d5c3786da395a0a2570b8c7853a9339/docs/neon-catalog-inspection.md)

## Hardware, vault and test evidence

- **Historical runner.** The reviewed CloudFormation runner was bootstrapped and
  attested; the temporary key initializer was subsequently removed. The
  November 18 replacement expired. On November 22 no active recovery instance
  was returned, although the remaining deployment stack still had resources.
  Instance expiry and full stack deletion have separate evidence.
  [Runner handoff](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-6971583102) ·
  [Initializer removal](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-6972337629)
- **Retained vault.** Frankfurt inventory showed the protected versioned
  S3 vault, retained recovery identity and one historical source-code bundle.
  The database-backup version count was zero. The vault is separate from the
  proposed private portfolio media bucket in Draft #16.
  [Vault provisioning evidence](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-6951963267)
- **Disposable verification.** CI #129 ran nine inspector cases and the
  PostgreSQL 18 and age round trip against simulated AWS, including archive
  rejection and interrupted upload. The later native PostgreSQL 18.7 local
  restore matched 17 table fingerprints, five migration checksums and 13
  validated foreign keys. Neither exercise used the live restore target or
  produced a live vault archive.
  [CI #129](https://github.com/wisheradam/adamwisher-portfolio/actions/runs/44359108115) ·
  [Local reference evidence](https://github.com/wisheradam/adamwisher-portfolio/pull/14#issuecomment-7076068313)

## Gates before a live rehearsal

1. Record current cumulative AWS cost evidence or the accepted conservative
   bound. Preserve the owner-accepted $2 incremental and $5 cumulative ceilings.
   The November 22 estimate was about $0.249 for eight hours of EC2, IPv4 and
   storage, with approximately $1.998 total incremental allowance. This was a
   candidate cost estimate. Tagged estimated zero did not establish cumulative
   spend. Verify the remaining budget and cleanup charges before provisioning.
2. Reconcile the expired stack with the ownership receipt and obtain the
   exact cleanup and new runner authorizations required by the reviewed
   controller. Bind a fresh expiry, exact reviewed artifacts, current endpoint
   resolution and short-lived permissions in the trusted session.
3. Prepare a dedicated synthetic source from `template0`. Verify the bare
   reader's effective privileges across connectable databases, including PUBLIC
   and inherited permissions. Preserve existing provider and application ACLs.
   Apply the approved migrations and fixture only to the dedicated source.
4. Verify target emptiness, pinned runtime identities and archived key version.
   Proceed under the observed runtime approval. Take a consistent logical
   dump using PostgreSQL 18, encrypt with age, and write to the existing vault.
   Record and verify the immutable object version, encryption, metadata,
   checksum and authenticated ciphertext before restoring.
5. Restore into the approved target transactionally. Compare schema, migration
   checksums, table counts, relationship constraints and row digests. Run the
   restored application harness against synthetic users and content. Preserve
   only approved redacted evidence.
6. Verify expiration and termination, revoke temporary credentials, and confirm
   there are no remaining sessions. Use the approved ownership-bound teardown
   and verify absence of disposable resources. Retain the vault and approved
   evidence. Disposal of the restore database requires separate approval.

Use the [reviewed EC2 recovery runbook](https://github.com/wisheradam/adamwisher-portfolio/blob/28e7eefb3d5c3786da395a0a2570b8c7853a9339/docs/neon-ec2-recovery.md)
and [synthetic source procedure](https://github.com/wisheradam/adamwisher-portfolio/blob/28e7eefb3d5c3786da395a0a2570b8c7853a9339/docs/neon-synthetic-source.md)
for commands and authorization boundaries.
