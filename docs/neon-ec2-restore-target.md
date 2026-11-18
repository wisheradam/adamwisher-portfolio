# PR #14 — verified empty restore target and B2 approval package

Starting SHA: `9b7cf61fadb5343f585b7c67aa57a982054e2a79`. Verified November 17, 2026.
Final delivery SHA and exact-SHA CI are in the PR conversation. This supersedes the
blocked-input B2 section in [B1 evidence](neon-ec2-b1-evidence.md).
No EC2, key initialization, source-row access, dump, restore, merge or deployment occurred.

## Data-free creation and actual catalog evidence

The available Neon connector's branch-creation operation cannot select schema-only.
Its ordinary parent branch operation would expose source rows, so it was not used.
The authenticated Neon Console's **Branch schema only** option created one independent
non-production root from integration-review's DDL. Control-plane metadata confirms
`init_source=parent-schema`, no parent ID, primary=false and default=false. No source SQL
or source application records were read. No connection strings or passwords were fetched.

The schema-only branch contains a template `neondb` with copied DDL, not source rows.
**That template database is not the restore destination.** A separate database was
created with PostgreSQL `TEMPLATE template0`, owned by the new restricted role.
The destination catalog, not an assumption about the branch name, establishes emptiness.

| Binding | Actual verified value |
|---|---|
| Project / region / server | shy-breeze-43898017 / aws-eu-central-1 / PostgreSQL 18.7 |
| Free subscription | free_v3, unchanged; 3/10 branches, 2 roots within published Free root allowance |
| Source branch | integration-review / br-wispy-darkness-b91vydbj |
| Source database / direct endpoint | neondb / ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech |
| New target branch | integration-restore-pr14-7955d1df / br-withered-wildflower-b9dm0qs3 |
| New target database | recovery_pr14_7955d1df, database ID 531091 |
| Target direct endpoint | ep-delicate-cloud-b99oh03j.c-7.eu-central-1.aws.neon.tech |
| Target endpoint compute | ep-delicate-cloud-b99oh03j, fixed 0.25 CU, plan-default suspension; subsequently observed idle |
| Target owner | recovery_restore_pr14_7955d1df |
| User relations / sequences / routines | 0 / 0 / 0 |
| Extra user schemas / large objects | 0 / 0 |
| Migration ledger | Absent |
| Restore role | NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS |
| Role membership / neon_superuser | No memberships / false |
| Restore privileges | Database owner; CREATE schema and objects verified |
| Database ACL | No PUBLIC grants; temporary inspector CONNECT removed |

No application tables means no application rows exist in this destination. No application
migration or bootstrap was run. The role was created through target-only SQL without a
password; owner operations used temporary SET ROLE delegation, then removed inherited/SET
access. Final catalog flags confirm temporary inspector access=false and login=false.
Neon's creator admin-option membership is not inherited or usable for SET ROLE and grants
nothing to the restore role. Authenticated restore-role login is deliberately **unverified**:
secure activation is a later trusted-runner operation, never a credential returned to Work.
The new branch has no automatic deletion date; its disposal remains separately approved.
Existing branches/databases, project settings and the Free plan were not modified.

## Verified DNS and narrow egress

At 16:06:52 UTC, both Google and Cloudflare HTTPS DNS resolvers returned Status=0,
CNAME `c-7.eu-central-1.aws.neon.tech` and the same A set for both direct hosts:
`3.77.164.229`, `18.192.71.94`, `63.178.183.218` (TTL 300 seconds).
The local Work system resolver was unavailable; HTTPS resolution supplied public metadata
only. A functioning system resolver is required on the approved provisioning operator and
runner. Failure or drift stops provisioning/recovery.

| Connection | Approved TCP 5432 egress | Required libpq hostaddr |
|---|---|---|
| Source | 3.77.164.229/32 | 3.77.164.229 |
| Target | 18.192.71.94/32 | 18.192.71.94 |

Both hosts share a multi-address proxy pool. The unchanged CloudFormation template still
allows exactly two /32s, not the entire pool. Linux service configuration now requires the
approved numeric hostaddr while preserving the exact hostname, sslmode=verify-full and
sslrootcert=system for SNI, certificate and passfile matching. Any addition/removal in the
FULL approved A sets stops execution, even if the selected address survives. No automatic
fallback or SG expansion occurs. The macOS validator remains unchanged and rejects hostaddr.
Runtime assembly binds source/target branch, database, endpoint, role and DNS metadata to
the B2 plan; restored application acceptance also rejects another database username.

## B1 vault reverified without mutation

Account `533267008693`, eu-central-1; exact retained vault stack remains CREATE_COMPLETE
with its original three resources, task tags, outputs and unchanged Original template.

- Stack ID: `arn:aws:cloudformation:eu-central-1:533267008693:stack/adam-neon-vault-pr14-7955d1df/bf273bb0-e270-11f1-8487-02ffe85685d3`.
- Bucket: `adam-neon-vault-pr14-7955d1df-archive-elmv9oxmapwe`.
- Key secret: `arn:aws:secretsmanager:eu-central-1:533267008693:secret:RecoveryIdentity-VMvNE5HfJdJx-9t1vj5`.
- ExpectedBucketOwner accepted; AES256, Versioning Enabled, all four public blocks true,
  BucketOwnerEnforced, IsPublic=false, exact TLS-deny policy. No versions/delete markers
  or multipart uploads. Secret has zero versions, no scheduled deletion. No secret read.
- Ownership receipt integrity remains
  `bd806d1b3d4c2a7eb5bfd9691320e8b99de41d89c6376814ffb59f6d4458aada`.

## Complete B2 scope and approval

The [exact public provisioning plan](../infra/recovery/pr14-b2-plan.json) contains actual
vault/Neon identifiers, full DNS sets, selected /32s, AMI and expiry, with no credentials.
Its file SHA-256 is `9b198256fcf63481cebfdfdcf23227bf6958a300c4e3f47df3fb9c2a6664efa3`.

**B2 action: provision. Approval fingerprint: `f89646cfbe3085f73a47c4e1449e654155b76d6b7ff39bb3ece081ddc78f1dab`.**

Expiry is **2026-11-17 23:30:00 UTC**, or **November 18, 01:30 Asia/Jerusalem**.
The controller accepts only a future expiry at most eight hours away. If this package
expires or any bound input/DNS answer changes, generate a fresh package and obtain new
approval. This fingerprint has not been approved or executed.

Proposed new runner stack: `adam-neon-recovery-pr14-7955d1df`, 16 CloudFormation resources:
one dedicated VPC, IGW and attachment, subnet, route/table/association, SG; one t3.small
with IMDSv2 and explicitly encrypted 16 GiB gp3; runner role/profile; expiry role, schedule group and
one-time schedule; no-transcript SSM session document; empty temporary DB-config secret.
Root volume and ENI are implicit EC2 resources. Canonical owner 099720109477's available
x86_64 EBS AMI `ami-04bbcae8eccec8bce` was verified using public SSM parameter version 81
and DescribeImages. No inbound rules, SSH key, NAT, paid endpoint, Elastic IP or new KMS key.
Outbound 443 remains for packages/AWS and exactly the two reviewed 5432 /32s above.
The account-wide EBS default remains untouched.

Runner template digest: `2d0b87c21b2847c49ffed6ef9f1068e442223ba99986fe838956bc622ed4ad33`.
B2 requires the operator's scoped CloudFormation/create resource permissions, iam:PassRole
for the new runner/expiry roles and native creation permissions for the listed resources.
Runner permissions remain exact recovery-prefix S3, exact vault/config-secret metadata
and reads, scoped stack metadata and SSM channels/heartbeat; no key writes, media reads
or deletion rights. The initializer policy stack is **excluded** from B2.

Execution on the approved operator environment only, after explicit B2 approval:

```bash
# Set PRIVATE_OPERATOR to the approved private operator directory, outside Work/CI/Git.
# Copy only this public plan; reconstruct the B1 receipt from the verified bindings below.
install -m 600 infra/recovery/pr14-b2-plan.json "$PRIVATE_OPERATOR/recovery-plan.json"
python3 - "$PRIVATE_OPERATOR/recovery-plan.json" <<'PYCODE'
import importlib.util,json,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('control','scripts/neon-ec2-control.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
path=Path(sys.argv[1]);plan=json.loads(path.read_text())
intent={k:plan[k] for k in ['account','region','run_id','vault_stack','runner_stack']}
r={'run_id':plan['run_id'],'intent':c.digest(intent),'vault':{
 'token':plan['run_id']+'-vault','template_sha256':c.digest(c.m.stacks()['vault']),
 'stack_id':plan['parameters']['VaultStackId']},'vault_outputs':{
 'Bucket':plan['parameters']['ArchiveBucket'],'KeySecretArn':plan['parameters']['KeySecretArn']}}
assert c.digest(r)=='bd806d1b3d4c2a7eb5bfd9691320e8b99de41d89c6376814ffb59f6d4458aada'
assert c.approval(plan,r,'provision')=='f89646cfbe3085f73a47c4e1449e654155b76d6b7ff39bb3ece081ddc78f1dab'
# Does not overwrite a different existing operational receipt.
state=path.with_suffix('.ownership.json')
assert not state.exists() or json.loads(state.read_text())==r
c.o.save(state,r)
PYCODE
python3 scripts/neon-ec2-control.py plan --stage provision --plan "$PRIVATE_OPERATOR/recovery-plan.json"
# STOP here unless f89646cfbe3085f73a47c4e1449e654155b76d6b7ff39bb3ece081ddc78f1dab was explicitly approved by the owner.
python3 scripts/neon-ec2-control.py provision --plan "$PRIVATE_OPERATOR/recovery-plan.json" --approval f89646cfbe3085f73a47c4e1449e654155b76d6b7ff39bb3ece081ddc78f1dab
```

The final command rechecks account, live vault ownership/security/template, receipt,
exact parameters, expiry and DNS before CreateStack. No resource is adopted by name alone.
After B2, verify actual encrypted/deleting EBS, IMDSv2, IAM, no ingress, exact egress,
expiry schedule and no-transcript SSM access; bootstrap and attest before any secret work.
B3/B4 still separately approve initializer permissions and key initialization. Securely
activate only the new restore role and populate/pin the new config-secret version on the
approved runner, never through Work or command logs. C still requires new live preflight
and explicit recovery fingerprint approval before source content/backup/restore.

## Current costs and cleanup

AWS Pricing GetProducts rechecked Frankfurt on November 17 (not a billing statement):

| Item | USD rate | Conservative allowance |
|---|---|---|
| t3.small Linux, standard CPU credits | 0.024/hour | 8 hours = 0.192 |
| Public IPv4 | 0.005/hour | 8 hours = 0.040 |
| gp3, baseline IOPS/throughput | 0.0952/GiB-month | 16 GiB × 8/730 = 0.0167 |
| S3 Standard, first tier | 0.0245/GiB-month | 2 GiB-month = 0.049 |
| S3 PUT/COPY/POST/LIST | 0.0054/1,000 | 0.02 request reserve |
| S3 GET | 0.0043/10,000 | Included in additional reserve |
| Secrets Manager | 0.40/secret-month; 0.05/10,000 calls | Two full secret-months = 0.80, calls 0.01 |

Core estimate 1.1277 + 0.50 transfer/GET/scheduler + 0.3723 tax/overhead reserve = **$2**,
with **$3 contingency**, preserving the **$5 planning ceiling**. It is not an AWS spending
cap. No free-tier discount is assumed. Retained vault at 2 GiB + one secret = **$0.449/month**;
actual empty vault currently has zero archive bytes. Version accumulation and data transfer
must remain within these reviewed bounds. No Neon paid resource or upgrade was selected.

The unchanged controller captures exact volume/ENI/IAM/secret/schedule IDs before deleting
only the owned runner stack. A one-time schedule terminates its exact EC2 ID by expiry;
stack deletion and orphan checks remove remaining temporary resources. Failed/interrupted
creation requires the receipted token/StackId and a newly approved failure-cleanup hash.
Never delete the retained vault. After a later successful recovery, D checks the exact
archive VersionId and pinned key version before and after cleanup. No archive/key exists
now, so actual post-termination recoverability is pending, not claimed. New PostgreSQL
credentials require explicit revocation; target disposal requires separate approval.

## Verification and remaining gates

Local: 96 EC2/secret/protocol/DNS unittest methods, 11 macOS guards, 23 application guard
assertions, eight recovery SQL checks and engineering-skill validation. The new DNS suite
has 21 methods covering drift, narrow CIDRs, exact hostaddr/TLS/role, source/target identity
and rejection of caller overrides. All existing guards remain. CI additionally executes
real PostgreSQL18 + age against synthetic data with an invalid DNS host and a working
hostaddr, encrypted roundtrip, corrupted archive rejection, interrupted upload and
independent-key recovery, plus lint/typecheck/build, application/security/migration and
Playwright. Final exact-SHA CI evidence belongs in the PR comment after observation.

Local cfn-lint/Guard binaries were absent on this resumed host; no local schema PASS is
claimed. Exact-commit CI runs pinned schema validation, three Guard checks and three
negative controls. No live application acceptance or backup rehearsal was authorized here.
Runtime Neon login, true EC2/IAM/SSM behavior, secret backend, restoration and cleanup remain
B2/B3/B4/C/D evidence, not synthetic guarantees. Stop for explicit B2 approval.

Applied guidance: repository PostgreSQL Architect, Security Auditor and Release Engineer
(read manually), official Neon and Neon Postgres with branching reference, AWS
CloudFormation, IAM, Secrets Manager and Billing/Cost. The connector lacks schema-only
creation and CLI was unavailable; the Console fallback above was used. No Skills installed
or changed. References: [schema-only](https://neon.com/docs/guides/branching-schema-only),
[PostgreSQL template0](https://www.postgresql.org/docs/18/sql-createdatabase.html),
[libpq host and hostaddr](https://www.postgresql.org/docs/18/libpq-connect.html#LIBPQ-PARAMKEYWORDS).
