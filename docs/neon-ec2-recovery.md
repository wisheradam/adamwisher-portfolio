# PR #14 — EC2 recovery: Checkpoint A evidence and Checkpoint B package

Implementation starting SHA: `ec0b4acd94ab3403290cc69d72f75fac11f78a27`.
Final SHA and exact-commit CI evidence are recorded in the PR conversation.
No resources have been provisioned and no live database contents have been accessed.

## Approval boundaries

A covers repository implementation, synthetic tests and non-mutating AWS/Neon checks.
B must explicitly approve the following provisioning scope before any paid creation.
C requires passing live preflight and a separately approved recovery fingerprint before
any database content access. D removes temporary infrastructure after recovery and app
acceptance. Neon restore-target disposal requires separate approval. Never merge,
modify production, enable cutover or upgrade Neon as part of this procedure.

## Verified inputs (November 17, 2026)

- AWS account `533267008693`, link Adam; region `eu-central-1`.
- Account EBS encryption defaults remain disabled. Every runner EBS volume is explicitly
  encrypted; no global default is changed. Official Canonical Ubuntu 24.04 amd64 AMI
  SSM parameter resolved to `ami-04bbcae8eccec8bce`; revalidate before B.
- Source project `shy-breeze-43898017`, branch `br-wispy-darkness-b91vydbj`, database
  `neondb`, direct host `ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech`.
- Neon metadata reports `free_v3`, PostgreSQL 18, 2/10 branches, 1 GiB branch limit,
  source logical size 34,521,088 bytes and project public transfer 26,038 bytes.
  Published Free allowances: 100 CU-hours/project/month, 1 GiB storage and 5 GiB
  public transfer. These metadata counters do not prove an exact remaining billing
  allowance; recheck the console before B/C. No quota/plan changes are permitted.
- AWS `ValidateTemplate` accepted the separate runner and vault templates. This checks
  service syntax, not provisioning success, service quotas, runtime encryption or IAM.
- `SimulatePrincipalPolicy` allowed the owner principal's requested create/delete stack,
  RunInstances, CreateRole, PassRole, CreateSchedule, CreateBucket and CreateSecret
  actions. It does not override an SCP, approval checkpoint, quota or actual API denial.

## Exact provisioning scope

Generate templates without applying them:

```bash
python3 infra/recovery/stacks.py vault > vault.json
python3 infra/recovery/stacks.py runner > runner.json
python3 infra/recovery/stacks.py initializer > initializer.json
```

Use NEW task stack names only:

| Stack | Scope | Lifetime |
|---|---|---|
| `adam-neon-vault-pr14` | Private S3 bucket/policy and recovery-identity secret | Retained independently |
| `adam-neon-recovery-pr14` | Dedicated VPC, IGW/attachment, subnet, route/association/table, SG, one EC2, IAM role/profile, expiry role/schedule, dedicated no-transcript session document, temporary DB-configuration secret | Delete at D |
| `adam-neon-recovery-pr14-key-initializer` | Single inline PutSecretValue permission for the new retained identity secret on the new runner role | Delete immediately after key initialization, before C |

No existing VPC, role, bucket, application media, Amplify configuration, global EBS
settings or production resource is updated. `create_stack` fails on existing names;
no update/deploy overwrite is used. No NAT gateway, paid VPC endpoint, Elastic IP,
customer-managed KMS key or persistent compute is created.

The instance is t3.small, Ubuntu 24.04, CPU-credit standard, IMDSv2 required/hop limit 1,
16 GiB encrypted gp3 with DeleteOnTermination. It has an automatically assigned public
IPv4 for outbound SSM, **no inbound rules, no SSH key and no public SSH**. TLS outbound
443 supports signed package/AWS endpoints; PostgreSQL 5432 allows exactly the independently
verified source and restore IPv4 /32s. Both DNS answer sets are checked before recovery
and restore. DNS drift stops execution, never expands rules automatically.

The source and restore endpoint CIDRs, restore branch/database, expiry UTC (maximum
8 hours ahead), output ARNs and AMI are reviewed non-secret plan inputs. Provision a
NEW empty non-production restore database/branch within the existing Free plan only
after approval; verify its project mapping/emptiness. If Free quota or schema-only
branch support prevents this, STOP without upgrading or cloning production contents.
No placeholder ID/IP may be used for an execution approval.

## Cost package — planning ceiling, not a billing cap

AWS Pricing API verified Frankfurt rates:

| Item | Rate | Planned bound |
|---|---|---|
| Linux t3.small | $0.024/hour | 8 hours = $0.192 |
| In-use public IPv4 | $0.005/hour | 8 hours = $0.040 |
| gp3 storage | $0.0952/GiB-month | 16 GiB × 8/730 hours ≈ $0.0167 |
| S3 Standard | $0.0245/GiB-month | Up to 2 GiB retained for one month = $0.049 |
| S3 PUT/COPY/POST/LIST | $0.0054/1,000 | Reserve $0.02 for requests |
| Secrets Manager | $0.40/secret-month; $0.05/10,000 calls | Conservatively budget $0.80 for two full secret-months plus $0.01 calls |

Core allowance ≈ **$1.13**. Reserve $0.50 for transfer/GET/scheduler calls and $0.37
for tax/rounding/operational overhead: **$2 planned, $3 contingency, $5 ceiling**.
This is not an AWS-enforced spending cap. No promotional free tier is assumed.
EC2/IPv4 rates accrue until actual termination, volumes until actual deletion.
The retained vault continues to cost about $0.45/month for one secret + 2 GiB archive
until separately reviewed; it is NOT silently deleted at teardown. Owner review at
30 days is required. Archive writes are capped at 1 GiB each; repeated failed runs
must not multiply retained versions without reviewing the $5 allowance.

An EventBridge Scheduler one-time UTC expiry targets TerminateInstances for **only this
instance**, with retries and self-deletion; it is not merely a tag. AWS API outages can
still delay termination. Network/IAM cleanup is performed by the idempotent teardown
controller and verified, not promised from a timer alone. The plan must include an
owner/operator watching expiry and retrying failed stack deletion. Standard CPU credits
avoid surplus-credit charges. No guarantee of an absolute maximum AWS invoice is made.

## Runtime implementation

`scripts/neon-ec2-bootstrap.sh` runs only on the new approved Ubuntu instance. It
switches the signed Ubuntu package sources to HTTPS, checks the PGDG signing-key
fingerprint, installs PostgreSQL 18 clients, age and AWS CLI, and installs the isolated
Python SDK environment from `infra/recovery/approved-python-requirements.txt` with
**all wheel hashes pinned**. It does not install a database server or fetch secrets.
Ubuntu/PGDG signed repositories are trust anchors; record resolved package versions
in live preflight. No curl-to-shell installer or untrusted plugin is used.

Package the approved repository SHA without untracked files using `git archive` and
transfer code only to a versioned `recovery/artifacts/` key after B. The instance fetches
that exact version with its IAM role (`get-object --version-id`), verifies the reviewed
SHA-256 and unpacks under `/opt/neon-recovery`. Do not put GitHub credentials in the VM.
No database content is ever included in a code bundle or a CI artifact.

`neon-ec2-run.py` uses a new Linux adapter; `neon-macos-recovery.py` is unchanged.
Preflight checks Ubuntu, no CI/static AWS credentials/swap, IMDSv2 identity, instance
account/region/type/AMI, actual attached encrypted/deleting EBS volumes, no inbound
rules, exact allowed egress, current DNS, PostgreSQL 18, protected tmpfs credentials,
verified TLS/direct hosts, readable/non-writing source and empty isolated target.
RLS/foreign tables/large objects or elevated database roles stop this version.

Source integrity and dump use one exported read-only snapshot. Table contents including
users, sessions, migration ledgers and audits are reduced to ordered SHA-256 digests
inside PostgreSQL. Schema and sequence state are compared too. Pause writers only
on the review source; sequences are not MVCC. No production write or pause is allowed.

`neon-ec2-adapter.py` streams `pg_dump -Fc` through age into multipart S3 upload. Failed
children cannot produce a successful version receipt; incomplete uploads are aborted,
with a one-day S3 lifecycle backstop for process death. Only a completed VersionId can
be fetched. The retained version is downloaded as **ciphertext** onto explicitly
encrypted EBS, authenticated completely with `age` and `pg_restore --list`, then restored
using `--single-transaction --exit-on-error --no-owner --no-privileges`. Plaintext dumps
never touch disk. Original DB owners/ACL/cluster roles are deliberately not replayed.
PostgreSQL client errors, response bodies and private values are never printed.

## Runtime secrets and independent key custody

The runner role has no SSM GetParameter privileges or managed SSM Core policy. It has
only SSM control/data channels and instance heartbeat, regional EC2 inspection, the
dedicated S3 recovery prefix, and read/describe permissions for exactly the two recovery
secrets. It cannot delete S3 versions/buckets/keys, read application media, change IAM,
change global encryption, or modify production. The expiry role can terminate only the
one runner instance. Metadata inspection permissions require wildcard resources because
those EC2 Describe APIs do not support resource-level scoping.

The owner populates the new DB-configuration secret through an approved secret interface;
never through Work, command text, shell history or SSM command parameters. Its SecretString
is JSON containing `service_file` and `pass_file` strings, with two exact source/target
services using sslmode=verify-full/sslrootcert=system and two exact passfile entries.
No wildcard passfile entries or alternate connection options are accepted.

Key initialization is executable on the attested EC2 with the separate temporary initializer
policy. `neon-key-initialize.py --plan ... --secret-arn ...` checks that the retained secret
has no versions, generates an age identity in memory, stores it using PutSecretValue,
and emits only the public recipient and VersionId. No private key file/output is made.
Delete the initializer policy stack immediately and verify PutSecretValue is denied
for the runner before C. Keep the `RECOVERY` label and pinned VersionId in the retained
vault; never rotate/delete them while any archive depends on them.

Secret delivery uses `neon-secret-launcher.py` with `{{resolve:secretsmanager:...}}`
references. The official bundled asm-exec resolver is vendored unchanged with SHA-256
`38399ce2a9a2b5e69fc9179815d90669e80612ea1dfc4dc2d399db9608488035` from the AWS
plugin's `aws-secrets-manager/references/asm-exec` (1.0.0). Its original command only
resolves arguments, despite its guidance describing environment resolution. The tested
launcher fixes that boundary: resolved values go ONLY into the child environment,
never argv. It retrieves no values in Work/CI. No direct secret-read API is called by
our orchestration. AWS MCP uses downstream IAM permissions; obsolete aws-mcp Invoke
permissions are not added. Restrict SSM operator access to the custom session document,
which disables S3/CloudWatch transcripts; do not use another session document.

Runtime secret files live mode 600 under a mode-700 `/run` tmpfs directory, no swap,
no core dumps. The environment is scrubbed before database/age children. The retained
secret is independent of EBS/EC2. Preflight proves its pinned version matches the public
recipient with a harmless marker. Synthetic acceptance deletes the original runtime
identity and decrypts using independent retained key state and the retained archive.
This proves the implemented cryptographic/lifecycle path, **not actual AWS termination**.
D must recheck actual S3 VersionId and retained secret version after termination.

## Executable owner phases (not run during implementation)

Use an approved private non-secret plan file. Controller modes require a matching plan
fingerprint and correct STS account. Examples below are procedures, NOT execution approval:

```bash
python3 scripts/neon-ec2-control.py plan --plan approved-plan.json
# After explicit B approval of that fingerprint only:
python3 scripts/neon-ec2-control.py provision-vault --plan approved-plan.json --approval FINGERPRINT
python3 scripts/neon-ec2-control.py provision --plan approved-plan.json --approval FINGERPRINT
python3 scripts/neon-ec2-control.py provision-initializer --plan approved-plan.json --approval FINGERPRINT
# Run key initialization on the approved instance, then remove initializer permissions:
python3 scripts/neon-ec2-control.py remove-initializer --plan approved-plan.json --approval FINGERPRINT
```

Plan keys: `account`, `region`, `vault_stack`, `runner_stack`, and `parameters` holding
ReviewedAmi, ArchiveBucket, SourceCidr, TargetCidr, KeySecretArn and Expiry. Runtime plan
additionally pins `ec2_runtime=true`, `ami`, source/target endpoints and /32 CIDRs,
`source_branch`, `target_branch`, `source_service`, `target_service`, public `recipient`,
`key_secret_arn`, `key_version`, `bucket` and unique `object_key` under recovery/.
Obtain actual IDs from the approved new stacks and verified Neon metadata; never infer
an empty restore target from inaccessible data. Do not use production branch IDs.

On EC2, launch the preflight using references only (actual ARNs are nonsecret inputs):

```bash
/opt/neon-recovery-venv/bin/python scripts/neon-secret-launcher.py \
  --configuration-ref '{{resolve:secretsmanager:DB_CONFIG_SECRET_ARN}}' \
  --identity-ref '{{resolve:secretsmanager:RETAINED_KEY_ARN}}' -- \
  /opt/neon-recovery-venv/bin/python scripts/neon-ec2-run.py preflight --plan runtime-plan.json
```

After C approval only, use the same launcher with `recover --plan ... --approval ...`.
Its fingerprint includes fresh permission observations and service mapping, not passwords.
Only sanitized status, the archive VersionId and integrity booleans are emitted.
Any changed role, endpoint, configuration or failed check requires a fresh preflight.

## Restored application acceptance and teardown

`neon-restored-app-acceptance.mjs` is a separately gated restored-target harness. Run only
on the approved target with an approved server-side runtime URL delivered through the
same secret boundary, a reviewed Node runtime, locked dependencies and production build.
It checks the five migration checksums, synthetic Super Admin/Editor/Read Only sessions,
anonymous denial, server RBAC, Draft/publication isolation, rollback, audit creation and
logout revocation. It modifies only uniquely named synthetic fixtures on the restore
DB and leaves their history for review. It never logs credentials, cookies or HTML.
This harness is prepared, not claimed as a live Neon PASS at A. Existing CI separately
runs the full local authentication/security/publication/browser acceptance suites.

D requires archive/key recovery evidence, application acceptance and owner-confirmed
revocation of temporary PostgreSQL credentials before reporting completion. Termination
alone does not revoke PostgreSQL passwords. Use the trusted Neon admin workflow to
revoke only the new recovery roles/credentials; do not alter existing users. The disposable
stack removes its temporary AWS DB secret; the archive/key vault is never deleted.
Neon target deletion remains a separate approval.

```bash
python3 scripts/neon-ec2-control.py teardown --plan approved-plan.json --approval FINGERPRINT
python3 scripts/neon-ec2-control.py verify --plan approved-plan.json --approval FINGERPRINT
```

The controller checks task ownership, deletes only the disposable stack, waits for deletion,
then inventories EC2 instances, EBS, ENIs, VPCs, subnets, security groups, routes and gateways
for task orphans. During teardown it also checks prior role/profile/schedule/session-document
IDs are absent. It fails rather than reports success if any remain or deletion fails.
A retained vault and a manual credential-revocation requirement are reported separately.
If a process is interrupted, retry against the same task receipt/stack ownership; never
broaden cleanup to arbitrary accounts, resources or name prefixes. Paid compute expiry
and stack teardown do not depend on the backup process remaining alive.

## Tests and security review scope

CI executes only synthetic/offline recovery tests: original 10 foundation guards, seven
new stack guards, protocol failure matrix, control guards, secret-environment tests,
and real PostgreSQL18/age recovery with in-memory AWS adapters. Failure cases include
missing approval, production target, DNS drift, invalid credentials, corrupted archives,
interrupted multipart upload, integrity mismatch, failed cleanup and orphans. The real
crypto/SQL test includes synthetic users/sessions/audit/migration/publication rows and
independent key recovery. No live AWS/Neon values enter tests or artifacts.

Live guarantees (SSM behavior, actual IAM propagation, AWS outages, actual volume deletion,
Neon reachability, key-retrieval backend and restore permissions) require B/C/D verification.
No synthetic test is represented as actual EC2 teardown or a production backup.

Official references: PostgreSQL 18 pg_dump/pg_restore documentation; AWS EC2 EBS encryption,
IMDSv2, SSM Session Manager, EventBridge Scheduler universal targets, S3 versioning and
Secrets Manager; Neon connection-pooling and Free-plan documentation. Current API checks
and CI links are recorded in the PR conversation.
