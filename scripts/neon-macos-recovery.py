#!/usr/bin/env python3
"""iMac-only controlled rehearsal. No database rows or client errors reach stdout."""
import argparse
import configparser
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time

SOURCE_BRANCH = 'br-wispy-darkness-b91vydbj'
SOURCE_ENDPOINT = 'ep-morning-dew-b97in9dm'
PRODUCTION_BRANCH = 'br-summer-bird-b915xsws'
ROOT = Path.home() / 'Library/Caches/adamwisher-neon-recovery'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def private_file(path):
    path = Path(path).expanduser()
    require(not path.is_symlink() and path.is_file(), 'Required private file missing or symlinked.')
    info = path.stat()
    require(info.st_uid == os.getuid() and stat.S_IMODE(info.st_mode) == 0o600,
            'Private files must be owned by this user with mode 600.')
    return path


def validate_plan(c, services):
    require(c['source_branch'] == SOURCE_BRANCH, 'Source must be existing integration-review.')
    require(c['target_branch'].startswith('br-') and c['target_branch'] not in
            [SOURCE_BRANCH, PRODUCTION_BRANCH], 'Target must be a different isolated branch.')
    require(all(re.fullmatch(r'[a-z][a-z0-9_]{0,63}', c[k]) for k in ['source_service','target_service']), 'Use simple service names without connection parameters.')
    require(c['source_service'] != c['target_service'], 'Services must differ.')
    source, target = services[c['source_service']], services[c['target_service']]
    allowed = {'host', 'port', 'dbname', 'user', 'sslmode', 'sslrootcert', 'channel_binding'}
    for service in [source, target]:
        require(set(service).issubset(allowed), 'Unsupported service parameter; use minimal service entries.')
        require(service.get('sslmode') == 'verify-full' and service.get('sslrootcert') == 'system', 'Verified TLS with system roots is required.')
        require(service.get('port', '5432') == '5432', 'Unexpected database port.')
        require(re.fullmatch(r'ep-[a-z0-9-]+\.c-[0-9]+\.[a-z0-9-]+\.aws\.neon\.tech', service['host']),
                'Use a direct Neon endpoint; pooled and custom hosts are prohibited.')
        require('-pooler.' not in service['host'], 'Use direct endpoints.')
        require(all(service.get(k) for k in ['host', 'dbname', 'user']), 'Incomplete service entry.')
    require(source['host'].startswith(SOURCE_ENDPOINT + '.'), 'Unexpected source endpoint.')
    require(source['host'] != target['host'], 'Source and target endpoints must differ.')
    require(c['target_endpoint'] == target['host'].split('.')[0], 'Target endpoint pin mismatch.')
    require(re.fullmatch(r'age1[0-9a-z]+', c['recipient']), 'Use an age X25519 public recipient.')
    return source, target


def safe_env(c):
    # Do not inherit connection overrides, passwords, proxies, or loader hooks.
    return {'HOME': str(Path.home()), 'PATH': os.environ.get('PATH', '/usr/bin:/bin'),
            'LANG': 'C', 'PGSERVICEFILE': str(Path(c['service_file']).expanduser()),
            'PGPASSFILE': str(Path(c['pass_file']).expanduser()), 'PGCONNECT_TIMEOUT': '15',
            'PSQL_HISTORY': '/dev/null', 'PGAPPNAME': 'approved-isolated-recovery'}


def run(args, env=None, input_bytes=None, tty=False):
    with open('/dev/tty', 'wb') if tty else open(os.devnull, 'wb') as errors:
        p = subprocess.run(args, input=input_bytes, stdout=subprocess.PIPE, stderr=errors,
                           env=env, check=False)
    require(p.returncode == 0, 'Client operation failed; details suppressed to protect data. Stop and review locally.')
    return p.stdout


def sql(c, side, statement, snapshot=None):
    if snapshot:
        require(re.fullmatch(r'[A-Fa-f0-9-]+', snapshot), 'Invalid snapshot identifier.')
        statement = "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET TRANSACTION SNAPSHOT '%s'; %s; ROLLBACK;" % (snapshot, statement)
    env = safe_env(c)
    env['PGOPTIONS'] = '-c default_transaction_read_only=on -c statement_timeout=120000'
    return run(['psql', '-XqAtw', '-v', 'ON_ERROR_STOP=1', '-d', 'service=' + c[side + '_service']],
               env, statement.encode()).decode().strip()


CATALOG = """SELECT json_build_object(
 'version',current_setting('server_version_num')::int,
 'elevated',(SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls FROM pg_roles WHERE rolname=current_user),
 'neon_admin',pg_has_role(current_user,'neon_superuser','MEMBER'),
 'db_owner',(SELECT datdba=(SELECT oid FROM pg_roles WHERE rolname=current_user) FROM pg_database WHERE datname=current_database()),
 'db_create',has_database_privilege(current_database(),'CREATE'),
 'relations',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','p','m','v','f','S')),
 'unreadable',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','p','m','v') AND NOT has_table_privilege(c.oid,'SELECT')),
 'writable',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','p','v','f') AND has_table_privilege(c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER')),
 'schema_create',(SELECT count(*) FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname<>'information_schema' AND has_schema_privilege(oid,'CREATE')),
 'unsupported',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND (c.relkind='f' OR c.relrowsecurity)),
 'sequence_access_failures',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind='S' AND (NOT has_sequence_privilege(c.oid,'SELECT') OR has_sequence_privilege(c.oid,'USAGE,UPDATE'))),
 'extra_schemas',(SELECT count(*) FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname NOT IN ('information_schema','public')),
 'user_routines',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'),
 'large_objects',(SELECT count(*) FROM pg_largeobject_metadata),
 'ledger',(SELECT count(*) FROM information_schema.tables WHERE table_name='admin_schema_migrations'))"""


def environment_check():
    require(platform.system() == 'Darwin', 'Run only on the proposed local iMac, not Work or CI.')
    require(os.geteuid() != 0, 'Do not run as root or sudo.')
    require(not any(os.environ.get(k) for k in ['CI', 'GITHUB_ACTIONS', 'SSH_CONNECTION']),
            'Use the local iMac terminal, not CI or a remote session.')
    for tool in ['psql', 'pg_dump', 'pg_restore', 'age']:
        require(shutil.which(tool), 'Missing required client: ' + tool)
    for tool in ['psql', 'pg_dump', 'pg_restore']:
        version = run([tool, '--version']).decode()
        require(re.search(r'\b18\.', version), 'All PostgreSQL clients must be version 18.')
    require('FileVault is On' in run(['/usr/bin/fdesetup', 'status']).decode(), 'FileVault must be on.')
    require(shutil.disk_usage(Path.home()).free >= 5 * 1024**3, 'At least 5 GiB free space required.')


def preflight(config):
    environment_check()
    c = json.loads(private_file(config).read_text())
    for key in ['service_file', 'pass_file', 'identity_file']:
        c[key] = str(private_file(c[key]))
    require(Path(c['identity_file']).read_bytes().startswith(b'age-encryption.org/v1'),
            'Recovery identity must itself be age passphrase-encrypted.')
    services = configparser.ConfigParser(interpolation=None)
    services.read(c['service_file'])
    require(not services.defaults(), 'Service defaults are prohibited.')
    source, target = validate_plan(c, services)
    # A dedicated passfile avoids wildcard or unrelated credentials.
    entries = [re.split(r'(?<!\\):', line) for line in Path(c['pass_file']).read_text().splitlines()
               if line and not line.startswith('#')]
    expected = {(s['host'], '5432', s['dbname'], s['user']) for s in [source, target]}
    require(len(entries) == 2 and all(len(e) == 5 and tuple(e[:4]) in expected and e[4]
            and '*' not in e[:4] for e in entries), 'Dedicated passfile requires two exact host/database/user entries.')
    # No source rows are fetched by preflight.
    src, dst = (json.loads(sql(c, side, CATALOG)) for side in ['source', 'target'])
    for state in [src, dst]:
        require(180000 <= state['version'] < 190000 and not state['elevated'] and not state['neon_admin'],
                'Require PostgreSQL 18 and non-administrator database roles.')
    require(not src['db_owner'] and not src['db_create'] and src['schema_create'] == 0
            and src['writable'] == 0 and src['unreadable'] == 0 and src['unsupported'] == 0
            and src['ledger'] > 0 and src['large_objects'] == 0 and src['sequence_access_failures'] == 0, 'Source must be complete, readable, non-writing and non-owning; no RLS/foreign tables.')
    require(dst['db_create'] and dst['relations'] == 0 and dst['extra_schemas'] == 0 and dst['user_routines'] == 0 and dst['large_objects'] == 0, 'Target must allow schema creation and contain no user relations.')
    sample = b'non-sensitive-recovery-key-preflight'
    encrypted = run(['age', '-r', c['recipient']], input_bytes=sample)
    decrypted = run(['age', '-d', '-i', c['identity_file']], input_bytes=encrypted, tty=True)
    require(decrypted == sample, 'Recovery key test failed.')
    # Pin reviewed nonsecret configuration, roles and endpoints without printing them.
    digest = hashlib.sha256(json.dumps({'config': c, 'services': {k: dict(services[k]) for k in
            [c['source_service'], c['target_service']]}, 'source': src, 'target': dst}, sort_keys=True).encode()).hexdigest()
    return c, digest


def pipeline(commands, env):
    children = []
    try:
        previous = None
        for command in commands:
            with open('/dev/tty' if command[0] == 'age' else os.devnull, 'wb') as errors:
                child = subprocess.Popen(command, stdin=previous.stdout if previous else subprocess.DEVNULL,
                                         stdout=subprocess.PIPE, stderr=errors, env=env)
            if previous:
                previous.stdout.close()
            children.append(child)
            previous = child
        output = children[-1].stdout.read()
        codes = [p.wait() for p in children]
        require(all(code == 0 for code in codes), 'Encrypted pipeline failed; no restore success claimed.')
        return output
    finally:
        for child in children:
            if child.poll() is None:
                child.terminate()
                child.wait()


def fingerprint(c, side, snapshot=None):
    # Values stay inside PostgreSQL; only per-table digests enter private process memory.
    query = """SELECT format('SELECT json_build_array(%L,count(*),encode(sha256(convert_to(coalesce(string_agg(encode(sha256(convert_to(row_to_json(t)::text,''UTF8'')),''hex''), %L ORDER BY encode(sha256(convert_to(row_to_json(t)::text,''UTF8'')),''hex'')), %L),''UTF8'')),''hex'')) FROM %I.%I t;', n.nspname||'.'||c.relname, '', '', n.nspname,c.relname)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema' AND c.relkind IN ('r','m')
 ORDER BY n.nspname,c.relname
\\gexec
"""
    # Do not import a snapshot using a statement that consumes it after the SELECT.
    if snapshot:
        query = "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET TRANSACTION SNAPSHOT '%s';\n%s\nROLLBACK;" % (snapshot, query)
    return sql(c, side, query)


def schema_digest(c, side, snapshot=None):
    command = ['pg_dump', '-w', '--schema-only', '--no-owner', '--no-privileges', '--no-comments',
               '-d', 'service=' + c[side + '_service']]
    if snapshot:
        command.append('--snapshot=' + snapshot)
    raw = run(command, safe_env(c)).decode()
    normalized = '\n'.join(line for line in raw.splitlines() if line.strip()
                           and not line.startswith(('--', '\\restrict ', '\\unrestrict ')))
    return hashlib.sha256(normalized.encode()).digest()


def sequence_state(c, side):
    return sql(c, side, """SELECT format('SELECT json_build_array(%L,last_value,is_called) FROM %I.%I;',
 n.nspname||'.'||s.relname,n.nspname,s.relname) FROM pg_class s
 JOIN pg_namespace n ON n.oid=s.relnamespace WHERE s.relkind='S'
 AND n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'
 ORDER BY n.nspname,s.relname
\\gexec
""")


def rehearsal(c, approval, digest):
    require(approval == digest, 'Approval fingerprint must match a fresh passing preflight.')
    with open('/dev/tty', 'r+') as tty:
        tty.write('Only after owner approval, type RUN ISOLATED RECOVERY: ')
        tty.flush()
        require(tty.readline().strip() == 'RUN ISOLATED RECOVERY', 'Execution not approved.')
    ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    require(not ROOT.is_symlink() and ROOT.resolve() == ROOT and stat.S_IMODE(ROOT.stat().st_mode) == 0o700,
            'Private local cache directory must have mode 700 and no symlink.')
    directory = Path(tempfile.mkdtemp(prefix='rehearsal-', dir=ROOT))
    archive = directory / 'database.dump.age'
    env = safe_env(c)
    holder = None
    report = None
    started = time.monotonic()
    try:
        holder = subprocess.Popen(['psql', '-XqAtw', '-v', 'ON_ERROR_STOP=1', '-d', 'service='+c['source_service']],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env)
        holder.stdin.write(b'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SELECT pg_export_snapshot();\n')
        holder.stdin.flush()
        snapshot = holder.stdout.readline().decode().strip()
        require(re.fullmatch(r'[A-Fa-f0-9-]+', snapshot), 'Could not hold consistent source snapshot.')
        before = fingerprint(c, 'source', snapshot)
        source_schema = schema_digest(c, 'source', snapshot)
        source_sequences = sequence_state(c, 'source')
        pipeline([['pg_dump', '-w', '-Fc', '--no-owner', '--no-privileges', '--snapshot='+snapshot,
                   '-d', 'service='+c['source_service']], ['age', '-r', c['recipient'], '-o', str(archive)]], env)
        require(archive.stat().st_size > 0, 'Encrypted archive missing.')
        # Authentication and archive format must validate BEFORE any target writes.
        # age prompts directly on /dev/tty; its private identity never becomes an argument value.
        pipeline([['age', '-d', '-i', c['identity_file'], str(archive)], ['pg_restore', '--list']], env)
        holder.stdin.write(b'ROLLBACK;\n\\q\n');holder.stdin.flush();holder.wait();holder = None
        require(json.loads(sql(c, 'target', CATALOG))['relations'] == 0, 'Target is no longer empty.')
        pipeline([['age', '-d', '-i', c['identity_file'], str(archive)],
                  ['pg_restore', '-w', '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges',
                   '-d', 'service='+c['target_service']]], env)
        after = fingerprint(c, 'target')
        require(before == after, 'Record/migration/audit consistency mismatch. Quarantine target.')
        require(source_schema == schema_digest(c, 'target'), 'Schema mismatch. Quarantine target.')
        require(source_sequences == sequence_state(c, 'target'), 'Sequence mismatch. Quarantine target.')
        report = {'status': 'RESTORE_RECORDS_MATCH', 'tables_checked': len(before.splitlines()),
                          'elapsed_seconds': round(time.monotonic()-started),
                          'schema_match': True, 'sequence_match': True, 'migration_history_match': True,
                          'schema_restore_transaction': 'committed', 'production_modified': False,
                          'global_roles_and_acl': 'intentionally not restored',
                          'remaining': 'restored-app RBAC/session tests and target disposal'}
    finally:
        if holder and holder.poll() is None:
            holder.terminate();holder.wait()
        shutil.rmtree(directory)
        require(not directory.exists(), 'Temporary artifact cleanup failed; investigate locally.')
        print(json.dumps({'temporary_backup_cleanup': 'verified', 'key_file': 'preserved separately',
                          'restored_target': 'retained for owner-approved validation/disposal'}))
    if report:
        print(json.dumps(report))


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['environment', 'preflight', 'rehearse'])
    parser.add_argument('--config')
    parser.add_argument('--approval', default='')
    args = parser.parse_args()
    try:
        if args.mode == 'environment':
            environment_check()
            print(json.dumps({'status': 'ENVIRONMENT_PASS', 'backup_executed': False, 'database_connected': False}))
            return 0
        require(bool(args.config), 'A private local plan file is required.')
        config, digest = preflight(args.config)
        if args.mode == 'preflight':
            print(json.dumps({'status': 'PREFLIGHT_PASS', 'approval_fingerprint': digest,
                              'backup_executed': False, 'database_contents_retrieved': False,
                              'requires': 'owner verification of branch mapping, local security and execution approval'}))
        else:
            rehearsal(config, args.approval, digest)
        return 0
    except RuntimeError as error:
        print('STOP: ' + str(error), file=sys.stderr)
        return 1
    except (OSError, ValueError, KeyError, configparser.Error):
        print('STOP: prerequisite, permission, approval, or client check failed. No success claimed; review locally without sharing secrets.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
