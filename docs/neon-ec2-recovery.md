# EC2 recovery implementation — incomplete, do not provision

Starting SHA: 2349ed72deef2834b2fecd7a5c1396065ac0b536.

Read-only verification on November 17, 2026 confirmed AWS account 533267008693,
eu-central-1, EBS encryption defaults disabled, and Ubuntu 24.04 amd64 SSM AMI
ami-04bbcae8eccec8bce. Existing VPCs/subnets were inspected but are not modified.
AWS Pricing GetProducts returned Linux t3.small On-Demand USD 0.024/hour.

`python3 infra/recovery/template.py` generates an UNAPPLIED foundation template.
It creates a dedicated VPC, internet gateway, subnet, route table/association, security
group, IAM role/profile, one t3.small with encrypted 16 GiB gp3 root EBS/IMDSv2,
and a dedicated private versioned SSE-S3 archive bucket/policy retained on deletion.
No SSH key or inbound rules; public IPv4 supports outbound SSM without NAT/endpoints.
TLS egress is 443; PostgreSQL egress requires a reviewed Neon /32. DNS changes must
fail closed and require fresh endpoint approval. CPU credits use standard mode.
Global EBS defaults and existing resources are untouched. No bootstrap, credentials,
recovery keys, or database contents are placed in user data.

Ten offline infrastructure guard tests pass. They do not constitute CloudFormation
service validation, IAM simulation, live encryption verification or teardown acceptance.
The role currently grants SSM Core and bucket-prefix upload/read only, with no delete.
It intentionally has no database-secret access until the secret-delivery design is
implemented and reviewed. AmazonSSMManagedInstanceCore has broad SSM parameter access;
that policy needs replacement/restriction before Checkpoint A can pass.

## Budget worksheet — NOT an approved or enforced cap

Eight runner hours: EC2 USD 0.192; public IPv4 at published USD 0.005/hour: USD 0.04.
Reserve USD 0.77 for up to one month of 16 GiB gp3 prorated storage, and USD 1 for
small encrypted archive retention/requests/transfers; total planning allowance about
USD 2 before tax, with USD 3 contingency. Only the EC2 rate has been verified via
AWS Pricing API. EBS/S3 regional rates, volume duration, retained size, transfer and
permissions still require verification. Retention incurs continuing S3 charges.
Expiry tags do not terminate resources and USD 5 is not an AWS-enforced spending cap.

## Remaining authorized implementation — Checkpoint A NOT complete

- Complete Linux/EC2 environment attestation without weakening the macOS script.
- Pin and install PostgreSQL 18/age/SSM using verified distribution sources.
- Implement runtime-only secret delivery, independent recovery-key custody and
  recovery-key proof outside EC2. No sensitive values through Work, RunCommand
  parameters/output, session transcripts or CI artifacts.
- Implement retained version-specific S3 archive upload/download, authentication,
  source exported snapshot, atomic restore and full consistency comparisons.
- Implement failure, interruption, orphan and teardown tests and live preflight.
- Verify Neon project/branch/database/direct endpoint and empty isolated target,
  current Free limits, permissions, template validity and all regional cost inputs.
- Prepare isolated application migration/RBAC/session/publication/audit acceptance.

Checkpoint B must present a complete verified scope/cost/teardown plan for approval.
Do not deploy this foundation. Checkpoint C requires a passing live preflight and
owner-approved execution fingerprint before any database content access. Checkpoint D
requires verified archive/key recoverability, dedicated compute/network/IAM cleanup,
credential revocation and separately approved Neon target disposal. No automatic S3
archive deletion or restore-target deletion is authorized.

No infrastructure, recovery execution, production change, merge or deployment occurred.
The iMac recovery implementation remains intact. PR #16 is not changed.
