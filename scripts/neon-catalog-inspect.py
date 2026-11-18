#!/usr/bin/env python3
"""Owner-only PR #14 catalog inspection. Output never includes libpq diagnostics."""
import argparse
import ctypes as C
import ctypes.util
import hashlib
import json
import os
from pathlib import Path
import select
import signal
import socket
import stat
import subprocess
import sys
import time

APPROVAL = '6ad843189e650af38304d00fdafa7ffa67902be60e05eead2b9bb8127cd17be1'
GRANT = """BEGIN;
GRANT recovery_restore_pr14_7955d1df TO neondb_owner WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY neondb_owner;
SET LOCAL ROLE recovery_restore_pr14_7955d1df;
GRANT CONNECT ON DATABASE recovery_pr14_7955d1df TO neondb_owner;
RESET ROLE;
REVOKE recovery_restore_pr14_7955d1df FROM neondb_owner GRANTED BY neondb_owner RESTRICT;
COMMIT;"""

REVOKE = """BEGIN;
GRANT recovery_restore_pr14_7955d1df TO neondb_owner WITH ADMIN FALSE, INHERIT FALSE, SET TRUE GRANTED BY neondb_owner;
SET LOCAL ROLE recovery_restore_pr14_7955d1df;
REVOKE CONNECT ON DATABASE recovery_pr14_7955d1df FROM neondb_owner RESTRICT;
RESET ROLE;
REVOKE recovery_restore_pr14_7955d1df FROM neondb_owner GRANTED BY neondb_owner RESTRICT;
COMMIT;"""

CATALOG = """SELECT clock_timestamp() AS checked_at,
       current_database() AS database_name, d.oid AS database_oid,
       current_user AS inspector, session_user AS login_role,
       pg_get_userbyid(d.datdba) AS database_owner, r.rolcanlogin AS owner_login,
       current_setting('transaction_read_only') AS read_only,
       jsonb_build_object(
         'schemas', (SELECT jsonb_agg(nspname ORDER BY nspname) FROM pg_catalog.pg_namespace WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'),
         'extensions', (SELECT jsonb_agg(extname ORDER BY extname) FROM pg_catalog.pg_extension),
         'relations', (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'),
         'routines', (SELECT count(*) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'),
         'types', (SELECT count(*) FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'),
         'shared_dependencies', (SELECT count(*) FROM pg_catalog.pg_shdepend WHERE dbid=d.oid),
         'large_objects', (SELECT count(*) FROM pg_catalog.pg_largeobject_metadata),
         'default_acls', (SELECT count(*) FROM pg_catalog.pg_default_acl),
         'event_triggers', (SELECT count(*) FROM pg_catalog.pg_event_trigger),
         'foreign_wrappers', (SELECT count(*) FROM pg_catalog.pg_foreign_data_wrapper),
         'foreign_servers', (SELECT count(*) FROM pg_catalog.pg_foreign_server),
         'user_mappings', (SELECT count(umid) FROM pg_catalog.pg_user_mappings),
         'publications', (SELECT count(*) FROM pg_catalog.pg_publication),
         'subscriptions', (SELECT count(subdbid) FROM pg_catalog.pg_subscription WHERE subdbid=d.oid),
         'logical_slots', (SELECT count(*) FROM pg_catalog.pg_replication_slots WHERE database=d.datname AND slot_type='logical'),
         'user_casts', (SELECT count(*) FROM pg_catalog.pg_cast WHERE oid>=16384),
         'user_transforms', (SELECT count(*) FROM pg_catalog.pg_transform WHERE oid>=16384),
         'migration_ledger', pg_catalog.to_regclass('public.admin_schema_migrations') IS NOT NULL
       ) AS inventory
FROM pg_catalog.pg_database d JOIN pg_catalog.pg_roles r ON r.oid=d.datdba
WHERE d.datname=current_database();"""
SQL_HASHES = {"catalog":"7240906c48716aea8c6c8c89ba615d392035f61defc77a80da974b5b091b2ec0","grant":"ea8f1983b7e4bada71c557382df81057b93a2cdcc560bcd265741296aee84e2d","revoke":"f964fb735c4bffaa68f18ee7046d865b8ed747b4ec81271a92fa5151d4be8df6"}
HOST = 'ep-delicate-cloud-b99oh03j.c-7.eu-central-1.aws.neon.tech'
ADDRESS = '18.192.71.94'
ANSWERS = {'3.77.164.229', ADDRESS, '63.178.183.218'}
OWNER = 'recovery_restore_pr14_7955d1df'
INSPECTOR = 'neondb_owner'
TARGET = 'recovery_pr14_7955d1df'
TARGET_OID = 17796
OWNER_ACL = OWNER + '=CTc/' + OWNER
TEMP_ACL = INSPECTOR + '=c/' + OWNER
LOCK = 14795144531
OPERATOR_LOCK = 14795144532
ORIGINAL_GRANTOR = 'cloud_admin'
WINDOW = 45  # Reserve 15 seconds within the approved 60-second window.
BASELINE = f"""
SELECT json_build_object(
 'oid', d.oid::bigint, 'db', d.datname, 'owner', r.rolname, 'login', r.rolcanlogin,
 'owner_elevated', r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls,
 'current', current_user, 'session', session_user,
 'memberships', (SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.oid),'[]') FROM pg_auth_members m
    WHERE m.roleid=r.oid OR m.member=r.oid OR m.grantor=current_user::regrole),
 'original_membership', (SELECT count(*) FROM pg_auth_members m
    WHERE m.roleid=r.oid AND m.member=current_user::regrole AND m.grantor='{ORIGINAL_GRANTOR}'::regrole
      AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option),
 'owner_membership_count', (SELECT count(*) FROM pg_auth_members m WHERE m.roleid=r.oid OR m.member=r.oid),
 'acl', ARRAY(SELECT x::text FROM unnest(d.datacl) x ORDER BY x::text),
 'connect', has_database_privilege(current_user,d.oid,'CONNECT'),
 'can_set', pg_has_role(current_user,r.oid,'SET'),
 'sessions', (SELECT count(*) FROM pg_stat_activity a WHERE a.datid=d.oid AND a.usename=current_user)
) FROM pg_database d JOIN pg_roles r ON r.oid=d.datdba WHERE d.datname='recovery_pr14_7955d1df'
"""


class Stop(Exception):
    pass


def require(ok, message):
    if not ok:
        raise Stop(message)


def checked_sql():
    for key, value in (('grant', GRANT), ('revoke', REVOKE), ('catalog', CATALOG)):
        require(hashlib.sha256(value.encode()).hexdigest() == SQL_HASHES[key], 'SQL digest mismatch')


class Connection:
    def __init__(self, settings, database, *, expect_denied=False, production=True):
        self.pq = C.CDLL(ctypes.util.find_library('pq') or 'libpq.so.5')
        ptr, string, integer = C.c_void_p, C.c_char_p, C.c_int
        for name, result, arguments in [
            ('PQlibVersion', integer, []), ('PQconnectdb', ptr, [string]),
            ('PQstatus', integer, [ptr]), ('PQsslInUse', integer, [ptr]),
            ('PQserverVersion', integer, [ptr]),
            ('PQerrorMessage', string, [ptr]), ('PQfinish', None, [ptr]),
            ('PQexec', ptr, [ptr, string]), ('PQresultStatus', integer, [ptr]),
            ('PQntuples', integer, [ptr]), ('PQnfields', integer, [ptr]),
            ('PQfname', string, [ptr, integer]), ('PQgetisnull', integer, [ptr, integer, integer]),
            ('PQgetvalue', string, [ptr, integer, integer]),
            ('PQclear', None, [ptr]),
        ]:
            function = getattr(self.pq, name)
            function.restype, function.argtypes = result, arguments
        if production:
            require(self.pq.PQlibVersion() >= 160000, 'libpq 16 or newer required')
        self.handle = None
        fields = {**settings, 'dbname': database}
        encoded = ' '.join(key + "='" + value.replace('\\', '\\\\').replace("'", "\\'") + "'"
                           for key, value in fields.items()).encode()
        self.handle = self.pq.PQconnectdb(encoded)
        try:
            require(self.handle, 'libpq connection allocation failed')
            connected = self.pq.PQstatus(self.handle) == 0
            if expect_denied:
                require(not connected and b'permission denied for database' in self.pq.PQerrorMessage(self.handle),
                        'Fresh target connection was not definitively denied')
                self.close()
            else:
                require(connected and (not production or self.pq.PQsslInUse(self.handle)),
                        'Authenticated TLS connection failed')
                require(180000 <= self.pq.PQserverVersion(self.handle) < 190000,
                        'PostgreSQL 18 server required')
        except BaseException:
            self.close()
            raise

    def close(self):
        if self.handle:
            self.pq.PQfinish(self.handle)
            self.handle = None

    def run(self, sql, *, named=False):
        result = self.pq.PQexec(self.handle, sql.encode())
        require(result, 'SQL result unavailable')
        try:
            status = self.pq.PQresultStatus(result)
            require(status in (1, 2), 'Database command failed')
            if status == 2:
                rows = range(self.pq.PQntuples(result))
                if named:
                    columns = [self.pq.PQfname(result, col).decode() for col in range(self.pq.PQnfields(result))]
                    return [{name: None if self.pq.PQgetisnull(result, row, col)
                             else self.pq.PQgetvalue(result, row, col).decode()
                             for col, name in enumerate(columns)} for row in rows]
                return [self.pq.PQgetvalue(result, row, 0).decode() for row in rows]
        finally:
            self.pq.PQclear(result)


def baseline(connection):
    rows = connection.run(BASELINE)
    require(len(rows) == 1, 'Target baseline unavailable')
    return json.loads(rows[0])


def normalized(row):
    return {key: value for key, value in row.items() if key != 'sessions'}


def verify_baseline(row, oid, temporary=False):
    require(row['oid'] == oid and row['db'] == TARGET and row['owner'] == OWNER
            and row['current'] == row['session'] == INSPECTOR
            and not row['login'] and not row['owner_elevated'] and not row['can_set']
            and row['original_membership'] == row['owner_membership_count'] == 1
            and row['acl'] == sorted([OWNER_ACL, TEMP_ACL] if temporary else [OWNER_ACL])
            and row['connect'] == temporary, 'Target ACL or role baseline differs')


def change(connection, sql, original, oid, *, temporary):
    # Execute the reviewed statements verbatim, with assertions before COMMIT.
    commands, commit = sql.rsplit('\n', 1)
    try:
        connection.run(commands)
        row = baseline(connection)
        verify_baseline(row, oid, temporary)
        require(row['memberships'] == original['memberships'], 'Role membership changed')
        connection.run(commit)
    except BaseException:
        try:
            connection.run('ROLLBACK')
        except Stop:
            pass
        raise


def revoke(connection, original, oid, *, allow_change=True):
    connection.run(f'SELECT pg_advisory_lock({LOCK})')
    try:
        row = baseline(connection)
        if normalized(row) != original:
            require(allow_change, 'Watchdog probe detected baseline drift')
            verify_baseline(row, oid, temporary=True)
            require(row['memberships'] == original['memberships'], 'Watchdog membership drift')
            change(connection, REVOKE, original, oid, temporary=False)
        require(normalized(baseline(connection)) == original, 'Original permissions not restored')
    finally:
        connection.run(f'SELECT pg_advisory_unlock({LOCK})')


def inspect_catalog(connection, oid):
    rows = connection.run(CATALOG, named=True)
    require(len(rows) == 1, 'Target inventory unavailable')
    row = rows[0]
    row['database_oid'] = int(row['database_oid'])
    require(row['owner_login'] == 'f', 'Target owner login unexpectedly enabled')
    row['owner_login'] = False
    row['inventory'] = json.loads(row['inventory'])
    require(row['database_name'] == TARGET and row['database_oid'] == oid
            and row['database_owner'] == OWNER and not row['owner_login']
            and row['inspector'] == row['login_role'] == INSPECTOR
            and row['read_only'] == 'on', 'Wrong target identity or transaction')
    inventory = row['inventory']
    expected = {'schemas': ['public'], 'extensions': ['plpgsql'], 'migration_ledger': False}
    for item in ('relations routines types shared_dependencies large_objects default_acls '
                 'event_triggers foreign_wrappers foreign_servers user_mappings publications '
                 'subscriptions logical_slots user_casts user_transforms').split():
        expected[item] = 0
    require(inventory == expected, 'Target catalog differs from approved empty inventory')
    return row


def private_settings(path):
    info = Path(path).lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_uid == os.getuid()
            and stat.S_IMODE(info.st_mode) == 0o600, 'Private operator passfile must be owned and mode 0600')
    answers = {x[4][0] for x in socket.getaddrinfo(HOST, 5432, socket.AF_INET, socket.SOCK_STREAM)}
    require(answers == ANSWERS, 'Native DNS answers differ')
    return {
        'host': HOST, 'hostaddr': ADDRESS, 'port': '5432', 'user': INSPECTOR,
        'passfile': str(Path(path).absolute()), 'sslmode': 'verify-full', 'sslrootcert': 'system',
        'gssencmode': 'disable', 'connect_timeout': '5', 'application_name': 'pr14-catalog-inspector',
        'tcp_user_timeout': '5000', 'keepalives_idle': '5', 'keepalives_interval': '2', 'keepalives_count': '3',
        'options': '-c search_path=pg_catalog -c statement_timeout=5000 -c lock_timeout=3000',
    }


def open_maintenance(settings):
    return Connection(settings, 'neondb')


def watchdog(passfile):
    connection = None
    try:
        # Do not arm against an unknown baseline. The private child has its own backend.
        original = json.loads(sys.stdin.readline())
        settings = private_settings(passfile)
        connection = open_maintenance(settings)
        row = baseline(connection)
        verify_baseline(row, TARGET_OID)
        require(normalized(row) == original, 'Watchdog baseline differs')
        # Exercise lock acquisition and cleanup verification against the unchanged baseline.
        revoke(connection, original, TARGET_OID, allow_change=False)
        print('READY ' + connection.run('SELECT pg_backend_pid()')[0], flush=True)
        # Parent death closes stdin and triggers cleanup immediately.
        if select.select([sys.stdin], [], [], WINDOW)[0]:
            sys.stdin.readline()
        revoke(connection, original, TARGET_OID)
        print('REVOKED', flush=True)
    finally:
        if connection:
            connection.close()


def watchdog_reply(child, seconds):
    if not select.select([child.stdout], [], [], seconds)[0]:
        return ''
    return child.stdout.readline().strip()


def orchestrate(settings, passfile):
    maintenance = target = operator_cleanup = None
    child = None
    original = None
    possibly_granted = restored = False
    try:
        maintenance = open_maintenance(settings)
        operator_cleanup = open_maintenance(settings)
        require(operator_cleanup.run(f'SELECT pg_try_advisory_lock({OPERATOR_LOCK})') == ['t'],
                'Another operator inspection holds the lock')
        pids = {session.run('SELECT pg_backend_pid()')[0]
                for session in (maintenance, operator_cleanup)}
        require(len(pids) == 2, 'Independent authenticated maintenance sessions required')
        row = baseline(maintenance)
        verify_baseline(row, TARGET_OID)
        require(row['sessions'] == 0, 'Existing inspector target session')
        original = normalized(row)
        require(normalized(baseline(operator_cleanup)) == original, 'Cleanup baseline differs')
        child = subprocess.Popen(
            [sys.executable, '-I', str(Path(__file__).resolve()), '--passfile', passfile,
             '--approval', APPROVAL, '--watchdog'],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            start_new_session=True, text=True,
        )
        child.stdin.write(json.dumps(original) + '\n')
        child.stdin.flush()
        status, _, watchdog_pid = watchdog_reply(child, 12).partition(' ')
        require(status == 'READY' and watchdog_pid.isdecimal() and watchdog_pid not in pids
                and child.poll() is None, 'Independent authenticated watchdog not ready')
        maintenance.run(f'SELECT pg_advisory_lock({LOCK})')
        row = baseline(maintenance)
        require(normalized(row) == original and not row['sessions'] and child.poll() is None,
                'Target or watchdog changed before grant')
        try:
            possibly_granted = True
            change(maintenance, GRANT, original, TARGET_OID, temporary=True)
        finally:
            # Closing releases the cooperative session lock even after an uncertain commit.
            maintenance.close()
        target = Connection(settings, TARGET)
        target.run('BEGIN READ ONLY')
        target.run("SET LOCAL statement_timeout='15s'; SET LOCAL idle_in_transaction_session_timeout='30s'")
        child.stdin.close()
        require(watchdog_reply(child, 12) == 'REVOKED', 'Watchdog cleanup unverified')
        require(normalized(baseline(operator_cleanup)) == original, 'Post-revoke baseline differs')
        restored = True
        Connection(settings, TARGET, expect_denied=True)
        result = inspect_catalog(target, TARGET_OID)
        target.run('ROLLBACK')
        target.close()
        deadline = time.monotonic() + 3
        while baseline(operator_cleanup)['sessions']:
            require(time.monotonic() < deadline, 'Inspector session still active')
            time.sleep(0.1)
        return {**result, 'original_acl_and_memberships_restored': True,
                'fresh_inspector_login_denied': True, 'inspector_target_sessions': 0}
    finally:
        if target:
            target.close()
        if maintenance:
            maintenance.close()
        if child and not child.stdin.closed:
            child.stdin.close()
        try:
            if possibly_granted and not restored:
                try:
                    revoke(operator_cleanup, original, TARGET_OID)
                except BaseException:
                    raise Stop('CLEANUP UNVERIFIED: use the approved independent revoke procedure') from None
        finally:
            if operator_cleanup:
                operator_cleanup.close()
            if child:
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    # Never kill the independent cleanup process.
                    pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--approval')
    parser.add_argument('--passfile', required=True)
    parser.add_argument('--watchdog', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    # Ignore libpq overrides. No credential is accepted in argv or environment.
    for key in tuple(os.environ):
        if key.startswith('PG') or key in ('SSL_CERT_FILE', 'SSL_CERT_DIR'):
            os.environ.pop(key)
    try:
        checked_sql()
        require(args.approval == APPROVAL, 'Exact inspection approval required')
        if args.watchdog:
            watchdog(args.passfile)
        else:
            def interrupted(_signal, _frame):
                raise Stop('Inspection interrupted')
            signal.signal(signal.SIGTERM, interrupted)
            signal.signal(signal.SIGHUP, interrupted)
            print(json.dumps(orchestrate(private_settings(args.passfile), args.passfile), sort_keys=True))
    except Stop as error:
        if not args.watchdog:
            print(str(error), file=sys.stderr)
        return 1
    except BaseException:
        if not args.watchdog:
            print('Inspection failed. If access was granted, verify cleanup in the private operator channel.',
                  file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
