#!/bin/bash
# Run only after B on the dedicated new instance. Never pass secrets as arguments.
set -euo pipefail
set +x
umask 077
ulimit -c 0
. /etc/os-release
[[ "$ID" == ubuntu && "$VERSION_ID" == 24.04 ]]
[[ "$(id -u)" == 0 ]]
sed -i 's|http://|https://|g' /etc/apt/sources.list.d/ubuntu.sources
apt-get update -qq
apt-get install -y --no-install-recommends ca-certificates curl gnupg age python3-venv awscli
install -d -m 755 /usr/share/postgresql-common/pgdg
curl --fail --silent --show-error https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
fingerprint=$(gpg --show-keys --with-colons /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc | awk -F: '$1=="fpr"{print $10;exit}')
[[ "$fingerprint" == B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8 ]]
printf '%s\n' 'deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main' > /etc/apt/sources.list.d/pgdg.list
apt-get update -qq
apt-get install -y --no-install-recommends postgresql-client-18
python3 -m venv /opt/neon-recovery-venv
recovery_root="$(cd "$(dirname "$0")/.." && pwd)"
[[ -f "$recovery_root/infra/recovery/approved-python-requirements.txt" ]]
/opt/neon-recovery-venv/bin/pip install --require-hashes -r "$recovery_root/infra/recovery/approved-python-requirements.txt"
# Does not install a database server, fetch secrets or start backup jobs.
# Official asm-exec must be independently installed/verified before preflight.
command -v age
pg_dump --version
