# PR #14 — B2 execution evidence and B3 approval package

Verified November 17, 2026. Starting SHA `2a4435ab7c272fbb087a02572b5616fd1dea2071`.
Final delivery SHA, code artifact version and exact-SHA CI are recorded in the PR conversation.
B2 was explicitly approved for fingerprint
`f89646cfbe3085f73a47c4e1449e654155b76d6b7ff39bb3ece081ddc78f1dab`.
The [approved public plan](../infra/recovery/pr14-b2-plan.json) and all three infrastructure
templates remain unchanged. Bootstrap corrections below change no bound infrastructure input.

## Pre-provision verification and actual creation

The remote branch still matched the starting SHA. Recomputed B2 fingerprint and vault
receipt matched approval. At 16:56:57 UTC, Google and Cloudflare HTTPS DNS independently
confirmed the complete three-address sets from the approved plan. No CIDR was widened.
Canonical SSM parameter version 81 still selected available x86_64 EBS AMI
`ami-04bbcae8eccec8bce`, owner `099720109477`, Ubuntu 24.04. The expiry was future and
less than eight hours away. Neon metadata still reported Free/free_v3, three of ten
branches, two roots, 1 GiB logical limit, and the original source/restore mappings.
Usage metadata was 1,070 compute seconds and 32,387 transfer bytes; these are metadata
counters, not a claim of an exact remaining CU-hour billing allowance. No Neon mutation.

Live vault checks matched its original template, outputs, ownership and task tags;
ExpectedBucketOwner, encryption, versioning, four public-access blocks, object ownership,
private policy and TLS deny passed. Recovery identity had zero versions.

The connected AWS control plane submitted exactly the approved generated runner template
with CAPABILITY_IAM, exact parameters and the deterministic client request token. It did
not execute a different template or adopt an existing stack. Native ValidateTemplate
passed; DescribeEvents confirmed the exact creation token on this CREATE_STACK operation
and no validation/provisioning failures. All 16 explicit resources reached CREATE_COMPLETE.

| Resource | Actual identifier |
|---|---|
| Account / region | 533267008693 / eu-central-1 |
| Runner stack | adam-neon-recovery-pr14-7955d1df |
| Stack ID | arn:aws:cloudformation:eu-central-1:533267008693:stack/adam-neon-recovery-pr14-7955d1df/7b0def90-e2a8-11f1-9977-02ffc93dfe43 |
| Operation ID | 7b0f4f20-e2a8-11f1-9977-02ffc93dfe43 |
| Creation token | 7955d1df474b450881f772c5e8d06b52-runner |
| EC2 | i-07f3f2096e32683a1 |
| Encrypted root EBS | vol-0e994ba3ff9d1aa7f |
| ENI | eni-059086279cbd74e9b |
| VPC / subnet | vpc-082b7d7a553250baf / subnet-06d63f389d8bce859 |
| Security group | sg-022310fe1803a8c5f |
| Internet gateway | igw-0f9291c899cb1f7cb |
| Route table / association | rtb-001f69fd4684b84b8 / rtbassoc-0966a99f5ab55ce41 |
| Runner role | adam-neon-recovery-pr14-7955d1df-Role-02aJPOQrFVBh |
| Instance profile | adam-neon-recovery-pr14-7955d1df-Profile-LEw7JoAfoD85 |
| Empty temporary configuration secret | arn:aws:secretsmanager:eu-central-1:533267008693:secret:DatabaseSecretArn-e9SDc9WHbPW8-JNykKV |
| No-transcript session document | adam-neon-recovery-pr14-7955d1df-SessionDocument-QmOGnYt3jpnF |
| Expiry group | adam-neon-recovery-pr14-7955d1df-expiry |
| Expiry role | adam-neon-recovery-pr14-7955d1df-ExpiryRole-6RIfMrOmR6xD |
| Expiry schedule | adam-neon-recovery-pr14-7955d1df-ExpirySchedule-1UJJFPOA1IH36 |

Actual original runner template matches digest
`2d0b87c21b2847c49ffed6ef9f1068e442223ba99986fe838956bc622ed4ad33`.

## Actual security verification

- One running t3.small, approved AMI, standard CPU credits. EC2 instance, system and
  attached EBS status checks passed. Launch time 17:03:46 UTC.
- One 16 GiB gp3 root volume, encrypted, baseline 3,000 IOPS/125 MiB/s,
  DeleteOnTermination=true. ENI also deletes on termination. No global EBS setting change.
- IMDSv2 required, metadata endpoint enabled, hop limit 1, metadata IPv6 disabled.
- No SSH key and no inbound rules. The single attached task SG permits only TCP 443
  outbound plus 5432 to 3.77.164.229/32 and 18.192.71.94/32. No IPv6, peer-group or
  prefix-list egress. Dedicated route goes to the dedicated IGW; no NAT/paid endpoint/EIP.
- Runner role trust and inline policy exactly match the resolved approved template.
  No attached managed policy; only RecoveryOnly inline policy. Profile contains only
  this role. No IAM expansion, SSM parameter reads, media access or key writes.
- Seven permission simulation scenarios allowed only the two exact secret reads and
  dedicated archive-prefix operations, and denied unrelated secrets, media, key writes/
  deletion and SSM parameter reads. No secret-read operation was actually executed.
- SSM agent Online, GetConnectionStatus connected. Successful secret-free Run Commands
  proved the management path. The custom Session document is Active, with empty S3 and
  CloudWatch transcript destinations and streaming disabled. No interactive session or
  authentication token was requested. Run Commands also had CloudWatch/S3 outputs disabled.
- Termination schedule is ENABLED, UTC at 2026-11-17T23:30:00, FlexibleTimeWindow OFF,
  retry maximum 20/event age 3,600 seconds. Its target input contains only this instance.
  Scheduler role trust is bound to this account and dedicated schedule group; its policy
  allows termination only of this instance. Per-resource simulation allowed the actual
  instance and denied an unrelated instance. Actual future termination is not yet claimed.

## Bootstrap defects corrected without weakening verification

The first reviewed bootstrap stopped because Ubuntu 24.04 has no awscli APT candidate.
It now installs official AWS CLI **2.40.4** from the versioned distribution, requiring:

- ZIP SHA-256 `81f573c2a0ace70cfb97aa4d014c17cbd605cb04cbad09adbc7aaf9c0979ae8e`.
- Isolated public keyring and exact AWS fingerprint
  `FB5DB77FD5C118B80511ADA8A6310ACC4672475C`.
- Valid signature status, rejection of expired/revoked/bad/wrong-signer states,
  and exact binary version before installation. Installer staging is removed on every exit.

The vendored file is AWS's **public signing key**, not a recovery identity. An older AWS
GitHub documentation copy had an expired certification; the current key from live official
AWS documentation was used. Its SHA-256 is
`279541b6dd1c831a260ee0f9fb71d63bbcc14ebc4bf62c605336e86c11d4eefb`.
The actual signed ZIP was independently verified locally and its binary version checked;
no CLI installation or AWS authentication was performed in Work.

A second bootstrap stop exposed the strict umask creating the public PGDG key mode 600.
The runner proved _apt could not read it. Only public repository key/list metadata now
receives mode 644, including safe retry handling. Private files retain umask 077. PGDG
fingerprint pinning, signed-by and APT signature verification remain enforced.

Ten new synthetic installer tests cover successful verification flow, corruption, wrong
key/signer, failed/expired signature, interrupted download, wrong binary version,
installation failure and cleanup. They never install packages or call AWS. The real
AWS package/signature was verified separately; simulated signatures are not called real crypto.

Final bootstrap Run Command `099bdf2c-ca5f-43bf-832d-83257586f40b` passed at 17:26:26 UTC,
including locked Python dependencies, checksum-pinned Node and production build. Only
public code and public vendor packages were transferred. Logs were kept on the encrypted
runner, only sanitized failure categories were returned, and the successful bootstrap
removed its temporary dependency/build log. Code artifact identity is in the PR evidence.

## Live non-secret environment attestation

Run Command `9c145903-86b2-4783-ab38-8910251329f1` passed at 17:29:53 UTC using the existing
Adapter.attest method on EC2. It verified Ubuntu, absence of CI/static credential files
and overrides, no swap, IMDSv2 identity, actual EBS/SG settings, full DNS sets, required
clients, private /run tmpfs and cleanup of the temporary mode-700 directory. Attestation
was persisted as non-sensitive JSON mode 600 under /run.

| Tool | Observed version |
|---|---|
| psql / pg_dump / pg_restore | PostgreSQL 18.7, Ubuntu 18.7-1.pgdg24.04+2 |
| age | 1.1.1 |
| AWS CLI | 2.40.4 |
| Node | v20.20.2 |

No database transport, SQL or secret retrieval occurred. An optional custom TLS-only
probe was rejected by the execution validator before any AWS call. It was removed;
only the reviewed metadata attestation ran. Actual PostgreSQL connectivity/TLS/authenticated
roles remain later live-preflight evidence. No guard was bypassed.

Both retained recovery-key and temporary configuration secrets still have **zero versions**.
No initializer stack, recovery identity or database credentials were created/activated.

## B3 approval package — initializer permission only

Action: **provision-initializer**. New stack:
`adam-neon-recovery-pr14-7955d1df-key-initializer`.

Approve only one AWS::IAM::Policy, RecoveryKeyInitializeOnly, attached to new runner role
`adam-neon-recovery-pr14-7955d1df-Role-02aJPOQrFVBh`, granting only
secretsmanager:PutSecretValue on retained key ARN
`arn:aws:secretsmanager:eu-central-1:533267008693:secret:RecoveryIdentity-VMvNE5HfJdJx-9t1vj5`.
No paid resource is added by B3. This permission approval does **not** authorize key
initialization, credential activation or content access. B4 and C remain separate gates.

**B3 fingerprint: `a34ca39f7948bd00ba6e175fbbbe82bd249d28223cf9fe4406baa6d6541d8a83`.**

Current ownership receipt integrity:
`9f18236e3ef2d8ca0a0e2ed7c627b6f2721bcd3a9d20a27c7462ac9264536dd2`.
These are sanitized handoff identifiers/hashes; no operational receipt is committed.
Reconstruct it only in the approved private operator directory, using the existing B2
receipt recipe plus these exact additions before computing the new fingerprint:

```python
receipt['runner'] = {
 'token': '7955d1df474b450881f772c5e8d06b52-runner',
 'template_sha256': '2d0b87c21b2847c49ffed6ef9f1068e442223ba99986fe838956bc622ed4ad33',
 'stack_id': 'arn:aws:cloudformation:eu-central-1:533267008693:stack/adam-neon-recovery-pr14-7955d1df/7b0def90-e2a8-11f1-9977-02ffc93dfe43'
}
receipt['runner_outputs'] = {
 'InstanceId': 'i-07f3f2096e32683a1',
 'DatabaseSecretArn': 'arn:aws:secretsmanager:eu-central-1:533267008693:secret:DatabaseSecretArn-e9SDc9WHbPW8-JNykKV',
 'RunnerRoleName': 'adam-neon-recovery-pr14-7955d1df-Role-02aJPOQrFVBh'
}
```

Use the existing private state file with atomic mode-600 persistence. Do not overwrite a
conflicting receipt. Reverify live stack ownership/security, unchanged templates, empty
identity and running attested instance before approval. The expiry is unchanged:
**November 17, 23:30 UTC / November 18, 01:30 Israel time**. No extension is approved.

```bash
python3 scripts/neon-ec2-control.py plan --stage provision-initializer --plan "$PRIVATE_OPERATOR/recovery-plan.json"
# STOP for explicit owner approval of the B3 fingerprint above. Only then:
python3 scripts/neon-ec2-control.py provision-initializer --plan "$PRIVATE_OPERATOR/recovery-plan.json" --approval a34ca39f7948bd00ba6e175fbbbe82bd249d28223cf9fe4406baa6d6541d8a83
```

After B3, bind its actual receipt into an initialization runtime plan and request B4.
No B4 fingerprint can be finalized before the initializer StackId exists. Following B4,
remove initializer permissions and verify write denial before C's separate live preflight.

## Costs, cleanup and remaining gates

Fresh Frankfurt Price List checks confirm: t3.small $0.024/hour; public IPv4 $0.005/hour;
gp3 $0.0952/GiB-month; S3 Standard first tier $0.0245/GiB-month; Secrets Manager
$0.40/secret-month plus $0.05/10,000 calls. Standard credits avoid surplus-credit billing.
Scripted calculations give $0.20 for EC2/IPv4/16 GiB EBS from actual launch to fixed
expiry (assuming successful termination), and $1.13 for the conservative eight-hour
core allowance including storage/secrets/request reserves. Preserve **$2 planned + $3
contingency = $5 planning ceiling**, not an enforced billing cap. Retained vault at one
secret plus 2 GiB remains about **$0.449/month** plus requests. No actual invoice is claimed.

Expiry terminates only EC2; complete network/IAM/empty-secret cleanup still requires the
reviewed teardown controller and owner approval. The vault bucket/policy/key are retained
independently. The actual controller's existing failure-cleanup path can remove this
unused runner without asserting backup success. With failure_cleanup=true and this exact
receipt its teardown fingerprint is
`902f87e869732414562a06793607ec91f6aae19d7183f7baded35c1a4ec163de`.
That is an unexecuted emergency/unused-runner cleanup package, not teardown approval.
Native CFN creation token and operation evidence permit safe interrupted-call reconciliation.
Do not delete by name/prefix alone or touch unrelated resources. Target disposal remains
separately approved. No archive/key recovery or actual AWS teardown is claimed at B2.

Local checks: 106 EC2/installer unittest methods, 11 macOS guards, 23 app guard assertions,
engineering/vendor validation, shell syntax, lint, TypeScript and production build.
Exact-SHA CI results are recorded in the PR conversation after observation. Existing CI
also runs real synthetic PostgreSQL18/age recovery, schema/Guard checks, migrations,
application/security/publication and browser gates. No live backup/restore is authorized.

Applied guidance: Project Instructions, latest AGENTS.md, repository Security Auditor and
Release Engineer, official AWS CloudFormation/IAM/Secrets Manager/Python SDK/Cost and
Neon/Neon Postgres. No Skills modified. No production, Neon plan, merge or deploy change.
Official installer references: [AWS CLI installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
and [version-pinned distributions](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-version.html).
