#!/bin/bash
# Scratch/CI tools only. Official release digest verified before extracting/executing.
set -euo pipefail
qa_root="${RUNNER_TEMP:-/tmp}/neon-recovery-infra-qa"
mkdir -p "$qa_root"
python3 -m venv "$qa_root/python"
"$qa_root/python/bin/pip" -q install 'cfn-lint==1.60.1'
curl --fail --silent --show-error -L https://github.com/aws-cloudformation/cloudformation-guard/releases/download/3.2.2/cfn-guard-v3-x86_64-linux-latest.tar.gz -o "$qa_root/guard.tar.gz"
printf '%s\n' "26549af66dff61e3e883819ee449769ddd33d53cc5109d223d28f2a26e30fda2  $qa_root/guard.tar.gz" | sha256sum --check --status
tar -xzf "$qa_root/guard.tar.gz" -C "$qa_root"
CFNLINT="$qa_root/python/bin/cfn-lint" CFNGUARD="$qa_root/cfn-guard-v3-x86_64-linux-latest/cfn-guard" python3 scripts/validate-ec2-templates.py
