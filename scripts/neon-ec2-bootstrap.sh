#!/bin/bash
# Run only after B on the dedicated new instance. Never pass secrets as arguments.
set -euo pipefail
set +x
umask 077
ulimit -c 0
. /etc/os-release
[[ "$ID" == ubuntu && "$VERSION_ID" == 24.04 ]]
[[ "$(id -u)" == 0 ]]
recovery_root="$(cd "$(dirname "$0")/.." && pwd)"
# These are public repository metadata, not credentials. APT's verifier runs as _apt.
for public_file in /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc /etc/apt/sources.list.d/pgdg.list; do
  if [[ -f "$public_file" ]]; then chmod 644 "$public_file"; fi
done
sed -Ei 's|http://[a-zA-Z0-9.-]*archive.ubuntu.com/ubuntu/?|https://archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu/?|https://security.ubuntu.com/ubuntu|g' /etc/apt/sources.list.d/ubuntu.sources
apt-get update -qq
apt-get install -y --no-install-recommends ca-certificates curl gnupg age python3-venv xz-utils unzip
bash "$recovery_root/scripts/neon-install-aws-cli.sh"
install -d -m 755 /usr/share/postgresql-common/pgdg
curl --fail --silent --show-error https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
chmod 644 /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
fingerprint=$(gpg --show-keys --with-colons /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc | awk -F: '$1=="fpr"{print $10;exit}')
[[ "$fingerprint" == B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8 ]]
printf '%s\n' 'deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main' > /etc/apt/sources.list.d/pgdg.list
chmod 644 /etc/apt/sources.list.d/pgdg.list
apt-get update -qq
apt-get install -y --no-install-recommends postgresql-client-18
python3 -m venv /opt/neon-recovery-venv
[[ -f "$recovery_root/infra/recovery/approved-python-requirements.txt" ]]
/opt/neon-recovery-venv/bin/pip install --require-hashes -r "$recovery_root/infra/recovery/approved-python-requirements.txt"
# Same reviewed Node 20 patch used by repository CI; verify official binary checksum.
curl --fail --silent --show-error https://nodejs.org/dist/v20.20.2/node-v20.20.2-linux-x64.tar.xz -o /var/tmp/neon-node.tar.xz
printf '%s\n' 'df770b2a6f130ed8627c9782c988fda9669fa23898329a61a871e32f965e007d  /var/tmp/neon-node.tar.xz' | sha256sum --check --status
install -d -m 755 /opt/neon-node20
tar --no-same-owner --strip-components=1 -xJf /var/tmp/neon-node.tar.xz -C /opt/neon-node20
rm /var/tmp/neon-node.tar.xz
export PATH="/opt/neon-node20/bin:$PATH"
cd "$recovery_root"
npm ci --ignore-scripts
npm run build
# Does not install a database server, fetch secrets or start backup jobs.
# Official asm-exec must be independently installed/verified before preflight.
command -v age
pg_dump --version
