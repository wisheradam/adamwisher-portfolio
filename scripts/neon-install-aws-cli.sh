#!/bin/bash
# Called by the approved Ubuntu runner bootstrap. Public installer only; no AWS calls.
set -euo pipefail
set +x
umask 077
recovery_root="$(cd "$(dirname "$0")/.." && pwd)"
cli_dir="$(mktemp -d "${TMPDIR:-/var/tmp}/neon-awscli.XXXXXX")"
trap 'rm -rf -- "$cli_dir"' EXIT
install -d -m 700 "$cli_dir/gnupg"
key="$recovery_root/infra/recovery/aws-cli-public-key.asc"
fingerprint="$(gpg --homedir "$cli_dir/gnupg" --batch --show-keys --with-colons "$key" 2>/dev/null | awk -F: '$1=="fpr"{print $10;exit}')"
[[ "$fingerprint" == FB5DB77FD5C118B80511ADA8A6310ACC4672475C ]]
curl --proto '=https' --tlsv1.2 --fail --silent --show-error https://awscli.amazonaws.com/awscli-exe-linux-x86_64-2.40.4.zip -o "$cli_dir/awscli.zip"
curl --proto '=https' --tlsv1.2 --fail --silent --show-error https://awscli.amazonaws.com/awscli-exe-linux-x86_64-2.40.4.zip.sig -o "$cli_dir/awscli.zip.sig"
printf '%s\n' "81f573c2a0ace70cfb97aa4d014c17cbd605cb04cbad09adbc7aaf9c0979ae8e  $cli_dir/awscli.zip" | sha256sum --check --status
# Verify with only this pinned public keyring; no import, keyserver or default keyring.
gpg --homedir "$cli_dir/gnupg" --batch --dearmor < "$key" > "$cli_dir/aws-cli.gpg"
gpg --homedir "$cli_dir/gnupg" --batch --no-default-keyring --keyring "$cli_dir/aws-cli.gpg" --trust-model always --no-auto-key-retrieve --status-fd 1 --verify "$cli_dir/awscli.zip.sig" "$cli_dir/awscli.zip" > "$cli_dir/signature.status" 2>/dev/null
grep -q '^\[GNUPG:\] VALIDSIG FB5DB77FD5C118B80511ADA8A6310ACC4672475C ' "$cli_dir/signature.status"
if grep -Eq '\[GNUPG:\] (KEYEXPIRED|SIGEXPIRED|EXPSIG|EXPKEYSIG|REVKEYSIG|BADSIG|ERRSIG|NO_PUBKEY)' "$cli_dir/signature.status"; then exit 1; fi
unzip -q "$cli_dir/awscli.zip" -d "$cli_dir"
[[ "$("$cli_dir/aws/dist/aws" --version)" == 'aws-cli/2.40.4 '* ]]
"$cli_dir/aws/install" --install-dir /opt/neon-aws-cli --bin-dir /usr/local/bin --update
