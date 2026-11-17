# PR #14 — B1 execution evidence and B2 handoff

Verified November 17, 2026. B1 only was explicitly approved by the owner.
Execution started from commit `8f4ea507a5a73e21326ffd9e44059f28cc623598`.
Final correction commit and exact-SHA CI are recorded in the PR conversation.

## Executed B1

Approved fingerprint: `bb30a8c14c8eb3196dc0c36cc943b1dbbffd0cdc3bba8bfaf1829997556fdc3c`.
AWS account `533267008693`, region `eu-central-1`.
The connected AWS control plane executed CreateStack with the exact approved generated
vault template, task tags and deterministic creation token. No credentials were requested
or transferred to the local workspace. No secret-value API was called.

| Resource | Actual identifier |
|---|---|
| Stack name | `adam-neon-vault-pr14-7955d1df` |
| Stack ID | `arn:aws:cloudformation:eu-central-1:533267008693:stack/adam-neon-vault-pr14-7955d1df/bf273bb0-e270-11f1-8487-02ffe85685d3` |
| Operation ID | `bf289b40-e270-11f1-8487-02ffe85685d3` |
| Archive bucket | `adam-neon-vault-pr14-7955d1df-archive-elmv9oxmapwe` |
| Recovery identity secret ARN | `arn:aws:secretsmanager:eu-central-1:533267008693:secret:RecoveryIdentity-VMvNE5HfJdJx-9t1vj5` |
| Creation token | `7955d1df474b450881f772c5e8d06b52-vault` |
| Approved vault template SHA-256 | `4c82a8dac2fe2072c348a84f279a6fafcce5cecaa8f4f2994ebd0ebae794e3b1` |

Stack and all three resources reached CREATE_COMPLETE. GetTemplate Original matched the
approved template hash exactly. Physical resource IDs matched both stack outputs; stack,
secret and creation events matched this account, region and task ownership.

## Actual verification

| Check | Observed result |
|---|---|
| S3 ownership | ExpectedBucketOwner=533267008693 accepted; owner-only FULL_CONTROL ACL |
| Region | eu-central-1 |
| Default archive encryption | AES256 (SSE-S3) |
| Versioning | Enabled |
| Public access | All four public-access blocks true; policy IsPublic=false |
| Object ownership | BucketOwnerEnforced |
| TLS | Bucket policy denies s3:* over insecure transport on bucket and objects |
| Retention | Bucket, bucket policy and identity secret retain on delete and replacement |
| Interrupted uploads | Enabled lifecycle abort after one day |
| Bucket contents | 0 object versions, 0 delete markers, 0 multipart uploads; no truncation |
| Recovery secret | Exact ARN and CloudFormation/task tags match; 0 versions including deprecated |
| Secret access | No resource policy; no deletion scheduled; no key initialized |

The secret has no customer KMS key override; it uses Secrets Manager's default managed
key behavior when values are initialized. No secret payload exists, so there is no
payload encryption or key-recoverability rehearsal to claim at B1.

No EC2, IAM role, EBS, VPC, initializer, restore target, backup, or database-content access
was performed. No existing AWS resource or global EBS default was modified.

## Live-observed controller correction

DescribeEvents returns the CREATE_STACK operation header separately from the
request-token-bearing stack progress events. The prior interrupted-create predicate
incorrectly required both fields on one event. The corrected guard correlates them by
nonempty OperationId AND exact StackId, then requires the exact creation token on a stack
CREATE_IN_PROGRESS/CREATE_COMPLETE event. It does not adopt stacks by tags or names.

The corrected predicate passed against the actual B1 metadata. Synthetic regressions
cover split events across pages, cross-operation/cross-stack substitution, update
operations and missing operation IDs. Existing guards are preserved. This correction
changes no infrastructure templates or B1 resources.

## Durable ownership handoff

All material below is sanitized identifier/hash evidence, not database data or secrets.
The authoritative operation, token, outputs and template are retained by CloudFormation.
The sanitized bindings and creation identifiers above can be used to reconstruct the
ownership receipt into the approved private operator directory from live APIs. No
operational receipt file is committed here. Keep operational copies out of Git/Work/CI
as required by the runbook.

Receipt integrity fingerprint:
`bd806d1b3d4c2a7eb5bfd9691320e8b99de41d89c6376814ffb59f6d4458aada`.
This is a vault-handoff hash, **not an executable B2 provisioning approval**.

## Checkpoint B2 package — blocked inputs

Known actual bindings:

- ArchiveBucket = `adam-neon-vault-pr14-7955d1df-archive-elmv9oxmapwe`.
- KeySecretArn = `arn:aws:secretsmanager:eu-central-1:533267008693:secret:RecoveryIdentity-VMvNE5HfJdJx-9t1vj5`.
- VaultStackId = `arn:aws:cloudformation:eu-central-1:533267008693:stack/adam-neon-vault-pr14-7955d1df/bf273bb0-e270-11f1-8487-02ffe85685d3`.
- Runner stack intent = `adam-neon-recovery-pr14-7955d1df` (not created).
- Canonical Ubuntu 24.04 AMI currently resolves to `ami-04bbcae8eccec8bce`.
- Source remains project `shy-breeze-43898017`, integration-review branch
  `br-wispy-darkness-b91vydbj`, direct endpoint
  `ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech`, database `neondb`.

B2 is **not approvable yet**. Live Neon metadata lists only production and
integration-review; no distinct restore target exists. B1 approval does not authorize
creating it. Source DNS resolution is unavailable from this review environment; no /32
has been invented. Required remaining inputs are a separately authorized empty isolated
restore target with verified project/branch/database/direct endpoint, current exact
source/target IPv4 /32 answers, and a UTC expiry at most eight hours ahead.

No B2 approval fingerprint is issued for an incomplete plan. A hash with placeholders,
missing CIDRs or an unverified target would defeat the staged approval controls.

After those inputs are explicitly authorized and verified, use the existing executable
procedure (on the approved operator environment, never with secret values in arguments):

```bash
python3 scripts/neon-ec2-plan.py bind-runner --plan /PRIVATE_OPERATOR/recovery-plan.json --inputs /PRIVATE_OPERATOR/runner-inputs.json
python3 scripts/neon-ec2-control.py plan --stage provision --plan /PRIVATE_OPERATOR/recovery-plan.json
# STOP for explicit B2 approval of that complete fingerprint.
```

The planned B2 architecture remains one t3.small, encrypted 16 GiB gp3, IMDSv2,
no ingress/SSH, scoped SSM/network/IAM/temporary DB secret, dedicated endpoint /32s
and at most eight-hour termination schedule. Key initialization and content access
remain B3/B4/C gates. Teardown removes only disposable resources, retaining this vault.

## Costs and status

Pricing API reverified Frankfurt S3 Standard at $0.0245/GiB-month and Secrets Manager at
$0.40/secret-month plus $0.05/10,000 calls. The empty B1 vault has no stored archive bytes;
$0.45/month remains the conservative retained-vault estimate at 2 GiB. Actual billing is
not claimed. The total temporary rehearsal plan remains $2 planned + $3 contingency,
within the $5 planning ceiling, not an AWS-enforced spending cap. No compute was provisioned.

PR #14 remains Draft. No merge, deployment, production change or Neon plan upgrade.

