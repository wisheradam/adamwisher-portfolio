# PR #14 — EC2 recovery: Checkpoint A evidence and Checkpoint B package

Checkpoint A foundation: `ec0b4acd94ab3403290cc69d72f75fac11f78a27`.
Final pre-provisioning hardening starts at `ab92763f1721c94e100f50bb1487a58990456c7a`.
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
- cfn-lint 1.60.1 and checksum-verified cfn-guard 3.2.2 validate all three templates and three deliberately broken security controls. CloudFormation does not support Scheduler ActionAfterCompletion; that invalid property was removed rather than suppressed.
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
| `adam-neon-vault-pr14-7955d1df` | Private S3 bucket/policy and recovery-identity secret | Retained independently |
| `adam-neon-recovery-pr14-7955d1df` | Dedicated VPC, IGW/attachment, subnet, route/association/table, SG, one EC2, IAM role/profile, expiry role/schedule, dedicated no-transcript session document, temporary DB-configuration secret | Delete at D |
| `adam-neon-recovery-pr14-7955d1df-key-initializer` | Single inline PutSecretValue permission for the new retained identity secret on the new runner role | Delete immediately after key initialization, before C |

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
instance**, with retries; it is not merely a tag. The one-shot schedule is removed at D, not automatically after invocation. AWS API outages can
still delay termination. Network/IAM cleanup is performed by the idempotent teardown
controller and verified, not promised from a timer alone. The plan must include an
owner/operator watching expiry and retrying failed stack deletion. Standard CPU credits
avoid surplus-credit charges. No guarantee of an absolute maximum AWS invoice is made.

## Runtime implementation

`scripts/neon-ec2-bootstrap.sh` runs only on the new approved Ubuntu instance. It
switches the signed Ubuntu package sources to HTTPS, checks the PGDG signing-key
fingerprint, installs PostgreSQL 18 clients, age and AWS CLI, and installs the isolated
Python SDK environment from `infra/recovery/approved-python-requirements.txt` with
**all wheel hashes pinned**. It also installs the checksum-pinned Node 20.20.2 runtime, uses the npm lockfile with lifecycle scripts disabled, and builds the application before secrets are populated. It does not install a database server or fetch secrets.
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
dedicated S3 recovery prefix, exact-stack CloudFormation metadata and vault security metadata, and read/describe permissions for exactly the two recovery
secrets. It cannot delete S3 versions/buckets/keys, read application media, change IAM,
change global encryption, or modify production. The expiry role can terminate only the
one runner instance. Metadata inspection permissions require wildcard resources because
those EC2 Describe APIs do not support resource-level scoping.

The owner populates the new DB-configuration secret through an approved secret interface;
never through Work, command text, shell history or SSM command parameters. Its SecretString
is JSON containing `service_file` and `pass_file` strings (and an `app_database_url` for separately approved restored-app testing), with two exact source/target
services using sslmode=verify-full/sslrootcert=system and two exact passfile entries.
No wildcard passfile entries or alternate connection options are accepted.

Key initialization is executable on the attested EC2 with the separate temporary initializer
policy. `neon-key-initialize.py --plan ... --secret-arn ...` checks that the retained secret
has no versions, requires its separately approved runtime-plan fingerprint, verifies vault/runner/initializer ownership, generates an age identity in memory, stores it using PutSecretValue,
and emits only the public recipient and VersionId. No private key file/output is made.
Delete the initializer policy stack immediately and verify PutSecretValue is denied
for the runner before C. Keep its unique `RECOVERY_<VersionId without hyphens>` label and pinned VersionId in the retained
vault; never rotate/delete them while any archive depends on them.

Secret delivery uses `neon-secret-launcher.py` with `{{resolve:secretsmanager:...}}`
references. The official bundled asm-exec resolver is vendored unchanged with SHA-256
`38399ce2a9a2b5e69fc9179815d90669e80612ea1dfc4dc2d399db9608488035` from the AWS
plugin's `aws-secrets-manager/references/asm-exec` (1.0.0). Its original command only
resolves arguments, despite its guidance describing environment resolution. The tested
launcher first attests EC2 before resolving any reference, then fixes that boundary: resolved values go ONLY into the child environment,
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

## Checkpoint B — staged approvals and executable procedure

**This package requests no execution during implementation.** Never reuse one fingerprint
for several phases. Each controller fingerprint covers the action, complete plan, current
ownership receipt and all three template hashes. Generated identifiers cannot be approved
before creation; B1 approves only the empty vault, B2 reviews and approves its actual
outputs plus the runner, and B3/B4 separately authorize the exact key initializer and
initialization. An approval is a human decision; a printed fingerprint is not approval.

| Boundary | Approved scope and evidence | Excluded |
|---|---|---|
| B1 | New vault only, account/region/run ID, exact templates, retained bucket/policy + empty identity secret | Runner, key material, DB access |
| B2 | Newly minted vault StackId/bucket/key ARN, live security/ownership checks, target metadata/DNS, AMI, /32s, <=8h expiry, exact runner template | Key initialization, contents |
| B3 | Minted runner role/DB secret/instance, exact retained key ARN, temporary initializer template | Any existing role/secret |
| B4 | Attested instance + separately approved initialization runtime fingerprint; initialize new empty retained identity exactly once | Backup/restore |
| C | Initializer deleted, write denial verified, immutable configuration/key version labels, live preflight fingerprint including target DB and application acceptance scope | Production or another target |
| D | Exact retained archive/key versions and successful app/independent recovery evidence; delete only receipted runner/initializer IDs | Retained vault or Neon target disposal |

On the owner's approved controller environment, install boto3 from the reviewed hash
lock; use the existing approved AWS login, never paste credentials. Create a private
operator directory OUTSIDE Git/Work/CI and keep all non-secret receipts there. Only code
and sanitized evidence may be transferred through Work. Do not run the following
mutating modes until the corresponding explicit approval.

```bash
umask 077
# Copy only the committed non-secret intent into the private operator directory:
install -m 600 infra/recovery/pr14-provisioning-intent.json /PRIVATE_OPERATOR/recovery-plan.json
python3 scripts/neon-ec2-control.py plan --stage provision-vault --plan /PRIVATE_OPERATOR/recovery-plan.json
# STOP for B1 approval of the printed fingerprint; then:
python3 scripts/neon-ec2-control.py provision-vault --plan /PRIVATE_OPERATOR/recovery-plan.json --approval B1_FINGERPRINT
```

B1's proposed intent is committed in `infra/recovery/pr14-provisioning-intent.json`.
Its fingerprint is recorded with exact-SHA evidence in the PR. The controller persists
creation intent BEFORE `create_stack`, then immediately records AWS's exact StackId.
A process interrupted between those operations may reconcile only a stack with the
same creation request token, task/run tags, account/region/name and template hash. An
unrelated existing stack, even one with the same prefix, is rejected, never adopted.

After B1, `recovery-plan.ownership.json` contains only public identifiers and hashes.
`bind-runner` verifies CFN resource ownership, vault outputs, ExpectedBucketOwner,
versioning, all four public-access blocks, AES256 encryption, retained TLS-deny policy
and exact secret ARN. It accepts ONLY ReviewedAmi, SourceCidr, TargetCidr and Expiry
in the owner's `runner-inputs.json`; bucket/key/VaultStackId are derived exclusively
from the new vault receipt. No existing bucket or secret can be substituted.

```bash
python3 scripts/neon-ec2-plan.py bind-runner --plan /PRIVATE_OPERATOR/recovery-plan.json --inputs /PRIVATE_OPERATOR/runner-inputs.json
python3 scripts/neon-ec2-control.py plan --stage provision --plan /PRIVATE_OPERATOR/recovery-plan.json
# STOP for B2 approval of actual generated IDs and this new fingerprint; then:
python3 scripts/neon-ec2-control.py provision --plan /PRIVATE_OPERATOR/recovery-plan.json --approval B2_FINGERPRINT
python3 scripts/neon-ec2-control.py plan --stage provision-initializer --plan /PRIVATE_OPERATOR/recovery-plan.json
# STOP for B3 approval of the minted role + key ARN; then:
python3 scripts/neon-ec2-control.py provision-initializer --plan /PRIVATE_OPERATOR/recovery-plan.json --approval B3_FINGERPRINT
```

`runner-inputs.json` is a JSON object with exactly the four keys above. Use the reviewed
Canonical AMI and verified single-answer source/target IPv4 /32s; Expiry is UTC
`YYYY-MM-DDTHH:MM:SS`, at most eight hours ahead. No placeholder addresses/IDs can
constitute approval. Confirm the isolated target project/branch/endpoint/database through
Neon metadata; source remains integration-review/neondb, never production. Free limits
and source/target DNS must be checked again immediately before provisioning.

Runtime public inputs are a JSON object with `target_branch`, `target_endpoint`,
`target_database`, and (after initialization) `recipient`, `key_version`,
`configuration_version`. No credentials belong in these files. Runtime assembly derives
all account/region/vault/role/configuration-secret/AMI/CIDR bindings from the receipts,
fixes the source identity, and rejects caller overrides:

```bash
python3 scripts/neon-ec2-plan.py bind-runtime --plan /PRIVATE_OPERATOR/recovery-plan.json --inputs /PRIVATE_OPERATOR/runtime-public-inputs.json --out /PRIVATE_OPERATOR/initialization-plan.json
```

Transfer only this private non-secret plan and reviewed code to the attested EC2. B4's
fingerprint is SHA-256 of Python `json.dumps(plan, sort_keys=True)` (the runtime protocol).
Print it with `python3 scripts/neon-ec2-plan.py fingerprint --plan initialization-plan.json`.
After explicit B4 approval, on EC2 only:

```bash
/opt/neon-recovery-venv/bin/python scripts/neon-key-initialize.py --plan initialization-plan.json --secret-arn EXACT_NEW_KEY_ARN --approval B4_RUNTIME_FINGERPRINT
```

It emits only public recipient + VersionId. The stored stage is
`RECOVERY_<VersionId without hyphens>`, never an unpinned AWSCURRENT alias. The owner
populates the exact new DB-configuration secret using an approved secret interface,
assigning a unique stage with the SAME formula for its exact VersionId. Never supply
secret contents through Work, shell text/history, SSM command parameters or screenshots.
Update only the public version IDs/recipient in runtime-public-inputs.json.

```bash
python3 scripts/neon-ec2-control.py plan --stage remove-initializer --plan /PRIVATE_OPERATOR/recovery-plan.json
# Approve removal (may be included in B3's explicit cleanup authorization), then:
python3 scripts/neon-ec2-control.py remove-initializer --plan /PRIVATE_OPERATOR/recovery-plan.json --approval REMOVE_FINGERPRINT
# Verify runner PutSecretValue denied; bind a NEW final runtime plan with updated receipts:
python3 scripts/neon-ec2-plan.py bind-runtime --plan /PRIVATE_OPERATOR/recovery-plan.json --inputs /PRIVATE_OPERATOR/runtime-public-inputs.json --out /PRIVATE_OPERATOR/runtime-plan.json
```

The launcher live-verifies vault and runner ownership, all actual provisioning parameters,
exact role/config-secret outputs and initializer deletion BEFORE resolving any reference.
Both reference strings must equal their canonical full ARN + SecretString + empty JSON
key + unique version stage. DescribeSecret must map each unique label to exactly the
approved VersionId; pins are checked again immediately before the child starts. No
names, AWSCURRENT aliases, JSON subkeys, alternate endpoints/interpreters or unrelated
secrets are accepted. Keep labels immutable and prohibit key writes after initialization.
The official resolver file remains unchanged. A tested runtime bridge validates its
exact operation/ARN/stage/region and appends native `--version-id` to the official MCP
request. AWS therefore checks VersionId and VersionStage atomically. The bundled
SMA path is disabled because it cannot enforce that native version pin; no fallback to
label-only retrieval is permitted. The official MCP backend must be verified on EC2
without logging secret responses before C. No secret-read call runs in Work or CI.

On EC2 (code paths relative to the approved code directory):

```bash
/opt/neon-recovery-venv/bin/python scripts/neon-secret-launcher.py \
  --runtime-plan runtime-plan.json \
  --configuration-ref '{{resolve:secretsmanager:EXACT_DB_SECRET_ARN:SecretString::RECOVERY_CONFIG_VERSION_WITHOUT_HYPHENS}}' \
  --identity-ref '{{resolve:secretsmanager:EXACT_KEY_SECRET_ARN:SecretString::RECOVERY_KEY_VERSION_WITHOUT_HYPHENS}}' -- \
  /opt/neon-recovery-venv/bin/python scripts/neon-ec2-run.py preflight --plan runtime-plan.json
```

Preflight persists its complete observed non-secret plan mode 600, then prints C's
fingerprint. This fixes the prior observation/fingerprint round-trip dependency.
Only after explicit C approval use the SAME launcher/references with BOTH launcher
`--approval C_FINGERPRINT` and child
`recover --plan runtime-plan.json --approval C_FINGERPRINT`.
A successful recovery persists `runtime-plan.recovery.json`, containing the approved
fingerprint, exact target, immutable archive VersionId, ciphertext byte count and key
version, plus MATCH status. No table values/digests, URLs with credentials or keys are
included. Any changed inputs/observations require new preflight and approval.

## Restored application acceptance and teardown

`neon-restored-app-acceptance.mjs` is a separately gated restored-target harness. Run only
on the approved target with an approved server-side runtime URL delivered through the
same secret boundary, a reviewed Node runtime, locked dependencies and production build.
Use the launcher with `--approval C_FINGERPRINT` and child
`/opt/neon-node20/bin/node scripts/neon-restored-app-acceptance.mjs --plan runtime-plan.json --approval C_FINGERPRINT`.
The launcher requires the successful recovery receipt; the harness independently checks
the canonical approved plan fingerprint, receipt, target branch/host/database and TLS.
Environment-only approval flags no longer authorize acceptance.
It checks the five migration checksums, synthetic Super Admin/Editor/Read Only sessions,
anonymous denial, server RBAC, Draft/publication isolation, rollback, audit creation and
logout revocation. It modifies only uniquely named synthetic fixtures on the restore
DB and leaves their history for review. It never logs credentials, cookies or HTML.
This harness is prepared, not claimed as a live Neon PASS at A. Existing CI separately
runs the full local authentication/security/publication/browser acceptance suites.

Normal D requires archive/key recovery evidence, application acceptance and owner-confirmed
revocation of temporary PostgreSQL credentials before reporting completion. Termination
alone does not revoke PostgreSQL passwords. Use the trusted Neon admin workflow to
revoke only the new recovery roles/credentials; do not alter existing users. The disposable
stack removes its temporary AWS DB secret; the archive/key vault is never deleted.
Neon target deletion remains a separate approval.

```bash
python3 scripts/neon-ec2-control.py plan --stage teardown --plan /PRIVATE_OPERATOR/recovery-plan.json
# Obtain D approval, then:
python3 scripts/neon-ec2-control.py teardown --plan /PRIVATE_OPERATOR/recovery-plan.json --approval D_FINGERPRINT
# Receipt changed, so generate the distinct read-only verification fingerprint:
python3 scripts/neon-ec2-control.py plan --stage verify --plan /PRIVATE_OPERATOR/recovery-plan.json
python3 scripts/neon-ec2-control.py verify --plan /PRIVATE_OPERATOR/recovery-plan.json --approval VERIFY_FINGERPRINT
```

Before normal D, copy the non-secret recovery receipt into `plan.retained`, rename its
`fingerprint` to `recovery_fingerprint`, and add `independent_key_recovery_verified=true`
and `application_acceptance_verified=true` ONLY after those operations pass. These are
owner attestations, not substitutes for live checks. Preserve the external custodian's
non-sensitive evidence separately. Before AND after stack deletion, the controller
HEADs exactly that object VersionId with ExpectedBucketOwner, checks returned VersionId,
AES256, bytes and recovery-fingerprint metadata, and DescribeSecret verifies the exact
retained key version + unique stage, with no pending secret deletion. It never reads
archive contents or secret values during owner-side cleanup. Actual post-termination
independent decryption remains a C/D live-evidence requirement, not a synthetic claim.

The controller checks task ownership, deletes only the disposable stack, waits for deletion,
then inventories EC2 instances, EBS, ENIs, VPCs, subnets, security groups, routes and gateways
for task orphans. During teardown it also checks prior role/profile/schedule/session-document
IDs are absent. It fails rather than reports success if any remain or deletion fails.
An explicitly approved new teardown fingerprint with `failure_cleanup=true` permits emergency cleanup after a failed/unused runner; it never claims backup/application success and still preserves the vault. Attached EBS/ENI IDs and IAM/secret/scheduler IDs are recorded in a private non-sensitive receipt, hashed into the ownership state, and checked directly; missing receipt or ambiguous API failure stops verification. A retained vault and a manual credential-revocation requirement are reported separately.
The failed initializer is removed first by its receipted StackId; partially rolled-back
runner stacks remain cleanable without an archive-success claim. The retained vault is
never deleted, including on failure. If vault creation itself fails before any runner
exists, retain its exact failure receipt and any retained resources for separate owner
review; do not adopt or delete another vault to retry.
If a process is interrupted, regenerate a stage fingerprint from the saved receipt,
obtain approval for the retry and use the same task ownership; never
broaden cleanup to arbitrary accounts, resources or name prefixes. Paid compute expiry
and stack teardown do not depend on the backup process remaining alive.

## Tests and security review scope

CI executes only synthetic/offline recovery tests: original 10 foundation guards, seven
new stack guards, protocol failure matrix, control guards, 33 ownership/staging/runtime/cleanup regressions, eight secret-delivery/version-pin tests, 11 application approval/target assertions,
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
