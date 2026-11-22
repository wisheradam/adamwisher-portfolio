# Current status and roadmap

[Handbook](README.md) · [History](history.md) · [Recovery](recovery.md)

Status reviewed November 22, 2026, against main `ae1113d`, the open draft
heads listed in [history](history.md#open-work), and read-only service metadata.

| Area | Evidence and boundary |
| --- | --- |
| Admin on main | Account/session controls, roles, content editing, media, settings, audit and six snapshot-backed modules are in main. Isolated tests cover server and browser behavior. Live hosting evidence establishes the Amplify revision. Production Admin login, durable persistence and configured database operation remain unverified. |
| Public reads on main | Static routes, snapshot readers and eligibility gates are implemented. The observed deployment revision matches main. Confirm actual settings and run anonymous smoke tests at release time. |
| Aurora | Data API adapter exists. No cluster was returned in the checked Stockholm and Frankfurt inventories. Live transaction, backup and restore acceptance remain open. |
| Neon | Draft #14 includes the PostgreSQL 18 adapter, tracked migrations and recovery tooling. Disposable and metadata checks passed. Live runtime WSS, application RBAC and restart persistence, source provenance, backup and restore remain gates. |
| Recovery | The owner inspected the empty isolated target and verified privilege cleanup. A retained vault exists. The expired stack needs verified cleanup, and the replacement, synthetic source and full rehearsal are pending. |
| Media | Main persists bytes to local storage. Draft #16 adds private S3 storage and publication-aware delivery. Production bucket policy, role, import, exact media-version recovery and live delivery are pending. |
| Release | Stockholm Amplify main has Auto Build enabled. Review candidate, configuration rollout and rollback together, with separate production release authorization. |

## Engineering sequence

1. Reconcile historical data inventories and owner-held exports, preserving
   provenance. Identify backup and media relationships without treating a
   missing inventory as an empty one.
2. Close the recovery gates in [the rehearsal record](recovery.md#gates-before-a-live-rehearsal)
   with an approved isolated source, trustworthy cost evidence and independent
   cleanup. Validate the direct PostgreSQL and application WSS paths separately.
3. Rebase and verify the stacked media draft against the intended Neon base.
   Test authorized live media operations and database/object reconciliation,
   then document the approved production storage mapping.
4. Exercise the browser flows on Safari and physical devices if required for
   release. Capture reproducible evidence for cold starts, role/session
   invalidation, public URLs, metadata, media and persistence on the approved
   staging configuration.
5. Review the production release as its own decision. Record owners, tested
   versions, data snapshots, recovery evidence and rollback triggers.

## Known gaps

Tokenless legacy mutations lack the stale-edit check. Snapshot revisions describe
the current published record, with no revision browse and restore UI. Audit data
shares the application database. Production identity federation and MFA are
outside the current Admin implementation. Ephemeral media and a failed or
ambiguous cross-service write need independent reconciliation. Automatic EC2
termination leaves other stack resources to verified teardown. These constraints
affect release criteria and recovery ownership.
