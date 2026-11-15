# Durable media implementation and release gates

## Scope and current status

Application implementation only; no bucket, IAM policy, account, production variable,
feature flag, migration or deployment was changed. Based on Neon Draft #14 at
`e2d8616899dc4f5afd6c70766d0c1a1afe4dc160`; its unresolved live WebSocket driver gate
remains. Work recovery stays independently releasable in Draft #15. Neither requires
S3. Current main is `4bbbef5462c637cfbb460ad710c4c8f086fd119a`.

Read-only inspection confirmed Stockholm Amplify `d1kl8c118pp04s`, WEB_COMPUTE,
main Auto Build enabled and compute role
`arn:aws:iam::533267008693:role/AmplifyCompute-adamwisher-contact`. Its existing
ContactOnly policy scopes SES sending to mail@adamwisher.com and DynamoDB UpdateItem
to adamwisher-contact-limits. The proposal adds a separate policy, preserving both.
No suitable dedicated portfolio bucket was established by the earlier inventory;
unrelated deployment/family-project buckets are not reused without ownership review.

## Application configuration

`ADMIN_MEDIA_DRIVER=s3`, `ADMIN_MEDIA_S3_BUCKET`, `ADMIN_MEDIA_S3_REGION=eu-north-1`,
`ADMIN_MEDIA_S3_PREFIX=media`. No S3 access keys in application config: use the existing
SSR compute role's default credential chain after explicit IAM approval. Clients initialize
lazily; builds perform no S3 operations. Local PGlite review storage remains supported;
remote Neon/Aurora without explicit S3 configuration remains unavailable rather than
writing transient local files.

AWS documents a 5.72 MB WEB_COMPUTE response ceiling:
https://docs.aws.amazon.com/amplify/latest/userguide/troubleshooting-SSR.html
S3 uploads are therefore limited to 4 MiB (including headroom for binary response encoding),
and S3 reads are bounded to that size. Local review keeps its previous 10 MiB limit.
Admin receives the effective limit from the server. Oversized legacy files require a
separately approved large-file delivery approach; preserve their backups and never truncate
them to import. Do not claim 10 MB authenticated Amplify file delivery works.

## Security and publication

Existing authenticated Admin upload/read/replace/edit/delete handlers retain their RBAC,
origin checks, file-signature/MIME/extension validation and audit boundaries. File size is
checked before reading its bytes. Object keys are random immutable UUIDs, with no user
filenames in paths; S3 PutObject uses If-None-Match *, AES256 encryption and private/no-store.
No browser credentials, public ACLs, bucket listing, presigned links or direct object URLs.
SDK request bodies/credentials are not logged. S3 response streams are consumed/destroyed.

`GET /api/media/{id}` is the new public delivery boundary. It requires database source
opt-in and a currently PUBLIC, nondeleted approved snapshot referencing the asset. Factual
Experience/Education/Certification references also require exact knowledge cutover; Release
and Timeline references honor their public flags and parent eligibility. Working Draft
references alone never grant access. Private/protected project body links are not scraped.
Every new request checks eligibility; unpublish removes it. No cross-request eligibility
cache. Downloads already in flight or already saved cannot be revoked. Headers include
private/no-store, nosniff, sandbox CSP and noindex. No credential or object key is returned.

Source-controlled covers/materials stay unchanged. Legacy Projects have no uploaded-cover
or attachment fields; this PR does not invent a new Project CMS or add snapshot support.
The public endpoint supports approved image/PDF media references in existing structured
modules. Uploaded Project attachments need a separately reviewed relation/publication model.

## Failure coordination and recovery

PostgreSQL and S3 are NOT one atomic transaction:

1. Validate and write a new unique object before the metadata transaction.
2. Lock existing metadata for a replacement, check all working/snapshot references, update
   metadata and audit in one database transaction. Referenced assets cannot be replaced;
   upload a separate Draft asset instead. FK locks and the metadata row lock serialize
   reference changes. Unreferenced replacements retain previous immutable objects, with
   old/new storage keys in audit for recovery.
3. On a confirmed rollback, remove the candidate only after an independent successful
   metadata AND audit lookup proves it unreferenced. A commit reply can be lost after
   commit. Unknown outcomes/read failures retain the object for reconciliation.
4. A failed upload does not write metadata. Ambiguous upload failures may leave orphans.
5. Soft deletion keeps physical objects, versions and audit. Referenced deletion is rejected.

Orphan cleanup is an operator procedure, not an installed cron: in a reviewed read-only
inventory, compare bucket keys/versions with ALL current metadata (including soft-deleted
rows) and audit old/new keys. Export a dry-run manifest; quarantine uncertain candidates;
require a grace period and approved deletion. Never expire objects merely by age. Runtime
cannot list buckets or delete object versions. Recovery operators need separately approved
ListBucket/GetObjectVersion privileges; those are deliberately absent from runtime IAM.
Concurrent database/object failures and permission errors require staging acceptance.
No automatic cleanup or version-expiration lifecycle rule is deployed by this proposal.

## Infrastructure proposal, not applied

`infrastructure/media-storage.cfn.json` proposes one generated-name private bucket in
Stockholm, Block Public Access, bucket-owner-enforced ownership, SSE-S3, versioning,
Retain deletion/replacement policies, a TLS-only bucket policy, and one separate inline
runtime policy permitting GetObject/PutObject/DeleteObject only on its media/* objects.
No ListBucket, DeleteObjectVersion, admin IAM permission, ACL or wildcard object access.
Abandoned multipart uploads are aborted after one day. Objects/versions do not auto-expire.
CloudFormation needs explicit CAPABILITY_IAM approval and provisioning budget approval.
No change set, stack or policy has been created. cfn-lint/schema and security assertions
are review evidence; a live change-set validation and S3/KMS/IAM integration remain gates.

## Stockholm cost evidence (November 15, 2026)

AWS Price List API, AmazonS3, eu-north-1: Standard SKU W3FCBWN4J47P9GU4,
$0.023/GB-month first 50 TB; PUT/COPY/POST/LIST $0.005/1,000; GET $0.0004/1,000.
Versions count as stored bytes. Estimates exclude tax/credits and assume doubled storage
for retained prior versions. No minimum bucket charge; retained storage costs money idle.

| Scenario | Current + retained GB | PUT / GET per month | S3 storage + requests |
| --- | --- | --- | --- |
| Low | 1 + 1 | 1,000 / 10,000 | $0.055 |
| Expected | 10 + 10 | 10,000 / 100,000 | $0.55 |
| Higher | 100 + 100 | 100,000 / 1,000,000 | $5.50 |

Same-region S3-to-application delivery is assumed; validate actual AWS billing topology in
staging. End-user delivery, SSR request/compute and CloudWatch are incremental Amplify
usage, not included in the S3 subtotal. At an illustrative $0.15/GB delivery allowance,
1/10/100 GB add $0.15/$1.50/$15.00; this allowance is not a complete hosting quote.
Budget $1/$5/$25 per month initially for the respective scenarios, with no guarantee:
measure object sizes, version growth, requests, transfer and SSR logs after staging.
Logging/monitoring resources are not provisioned here. Optional S3 access logs would add
storage/requests and require a separate approved destination/retention policy.

## Validation and limitations

The media test injects an object-store client and uses real disposable PostgreSQL-compatible
PGlite metadata transactions. It covers SDK request policy, invalid config/keys, failed
upload, audit rollback, compensation, uncertain retention, immutable replacement,
referenced deletion/replacement, Draft/public/unpublish and cutover privacy. Existing HTTP
security acceptance now checks anonymous published-media delivery, secure headers and
immediate eligibility removal after unpublish. This is NOT a live AWS S3 test.

Full repository CI includes PostgreSQL 18 migration/publication, adapter cleanup,
authentication/RBAC, publication, Work privacy, SEO, browser and responsive acceptance.
No actual S3 bucket or role permissions are available in the approved task scope, so
live upload/download, version restore, compensation and actual Amplify payload acceptance
remain blocked until an isolated staging bucket and scoped access are approved.

## Release and production recovery gates

Work: exact PR #15 SHA 82d6cb833662c5df6cc630c4944e343f5b462287 has 59/59 browser tests
and CI https://github.com/wisheradam/adamwisher-portfolio/actions/runs/43761913689 .
Explicit merge approval is required: main Auto Build is currently enabled and may deploy
immediately. Validate the resulting merge SHA CI and Stockholm job commitId; do not mistake
the feature head for the merge commit. Smoke Home, Work, six routes, protected paths,
metadata/sitemap/assets, desktop/mobile and console/runtime errors. Last known good main
4bbbef5462c637cfbb460ad710c4c8f086fd119a is the code rollback candidate; inspect actual last
successful Amplify job and compatibility before approving any manual redeploy. No database
rollback is part of Work recovery. No production recovery is claimed before live smoke.

Neon: reuse integration-review. Prior live API checks established PostgreSQL 18.7,
historical migration SQL, rollback, Draft isolation, audit failure rollback and synthetic
logical restoration to Neon/PGlite. Runtime WSS, live application RBAC and cold starts remain
unverified. No production migration/bootstrap/cutover is authorized.

Before database/storage cutover inventory both old Amplify apps and owner-held SQLite,
PGlite, media directories and exports. Do not infer missing databases means no data. Freeze
writes for export; preserve IDs, users/roles, publications, sessions and audits. Encrypt
independent pg_dump and object/version manifests outside Neon using an operator-held key
(e.g. GPG recipient encryption), checksum and record migration versions, then restore into
an isolated Neon target. Compare counts, FK/orphans, sample hashes and restored auth/public
behavior. The existing synthetic restore does not prove full pg_dump recovery. Proposed daily
backups for 14 days imply up to 24-hour independent-backup RPO; target RTO four hours must
be measured. Free-plan recovery history and quotas must be rechecked before cutover; no
paid upgrade is authorized. A branch is not an independent backup.

Only after successful restore and live staging tests: review pending migrations -> authorize
migration -> reconcile -> authorize runtime configuration -> bootstrap ONLY if demonstrably
empty and explicitly approved -> exact-SHA CI -> separate merge/deployment approval ->
persistence-after-restart and smoke tests. Roll code/config back without deleting newly
written data; reconcile writes before switching backends. No destructive down migration.

Required approvals are separate: (1) merge/release Work #15; (2) isolated S3 bucket and the
specific additional IAM policy/budget; (3) live staging tests and recovery operator access;
(4) production data migration/bootstrap/runtime configuration; (5) later PR merges/deployments.
Continue repository-only work while these gates remain closed.
