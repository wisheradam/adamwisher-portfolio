#!/usr/bin/env python3
"""Exercise the private operator script against a disposable local PostgreSQL 18 service."""
import importlib.util
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest

SOURCE = Path(__file__).with_name('neon-catalog-inspect.py').resolve()
spec = importlib.util.spec_from_file_location('inspection', SOURCE)
inspection = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspection)
Native = inspection.Connection


def wire(settings, database, **options):
    return Native(settings, database, production=False, **options)


def run_subject():
    index = sys.argv.index('--passfile')
    fixture = json.loads(Path(sys.argv[index + 1]).read_text())
    if '--subject' in sys.argv:
        sys.argv.remove('--subject')
    inspection.__file__ = __file__
    inspection.private_settings = lambda _path: fixture['settings']
    inspection.Connection = wire
    inspection.TARGET_OID = fixture['oid']
    inspection.BASELINE = inspection.BASELINE.replace("'cloud_admin'::regrole", "'postgres'::regrole")
    inspection.WINDOW = 2
    scenario = fixture['scenario']
    is_watchdog = '--watchdog' in sys.argv

    def connect(settings, database, **options):
        if database == inspection.TARGET and not options and not is_watchdog:
            if scenario == 'connect-failure' or scenario == 'cleanup-failure':
                raise inspection.Stop('Injected target connection failure')
            if scenario == 'watchdog-timeout':
                time.sleep(3)
            if scenario == 'interrupted':
                os.kill(os.getpid(), signal.SIGTERM)
            if scenario == 'parent-killed':
                os.kill(os.getpid(), signal.SIGKILL)
        if is_watchdog and scenario == 'unready':
            raise inspection.Stop('Injected watchdog authentication failure')
        return wire(settings, database, **options)

    inspection.Connection = connect
    if scenario == 'cleanup-failure':
        original_revoke = inspection.revoke

        def fail_cleanup(connection, original, oid):
            if inspection.baseline(connection)['connect']:
                raise inspection.Stop('Injected unavailable cleanup channel')
            return original_revoke(connection, original, oid)
        inspection.revoke = fail_cleanup
    return inspection.main()


class CatalogInspection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        port = int(os.environ.get('CATALOG_TEST_PORT', '5432'))
        cls.admin_settings = {
            'host': '127.0.0.1', 'port': str(port), 'user': 'postgres', 'password': 'isolated-ci-only',
            'connect_timeout': '3', 'options': '-c search_path=pg_catalog -c statement_timeout=5000',
        }
        cls.admin = wire(cls.admin_settings, 'postgres')
        try:
            require = inspection.require
            require(cls.admin.run('SHOW server_version_num')[0].startswith('18'), 'Disposable PostgreSQL 18 required')
            require(cls.admin.run("SELECT count(*) FROM pg_roles WHERE rolname IN ('cloud_admin','neondb_owner','recovery_restore_pr14_7955d1df')") == ['0'], 'Test roles already exist')
            require(cls.admin.run("SELECT count(*) FROM pg_database WHERE datname IN ('neondb','recovery_pr14_7955d1df')") == ['0'], 'Test databases already exist')
            cls.admin.run("CREATE ROLE cloud_admin SUPERUSER NOLOGIN; CREATE ROLE neondb_owner LOGIN NOINHERIT PASSWORD 'isolated-ci-only'; CREATE ROLE recovery_restore_pr14_7955d1df NOLOGIN")
            cls.addClassCleanup(cls.clear_fixture)
            cls.admin.run("GRANT recovery_restore_pr14_7955d1df TO neondb_owner WITH ADMIN TRUE, INHERIT FALSE, SET FALSE")
            cls.admin.run('CREATE DATABASE neondb TEMPLATE template0')
            cls.admin.run('CREATE DATABASE recovery_pr14_7955d1df OWNER recovery_restore_pr14_7955d1df TEMPLATE template0')
            cls.admin.run('REVOKE ALL ON DATABASE recovery_pr14_7955d1df FROM PUBLIC')
            cls.settings = {**cls.admin_settings, 'user': 'neondb_owner'}
            cls.inspector = wire(cls.settings, 'neondb')
            cls.addClassCleanup(cls.inspector.close)
            inspection.BASELINE = inspection.BASELINE.replace("'cloud_admin'::regrole", "'postgres'::regrole")
            row = inspection.baseline(cls.inspector)
            inspection.verify_baseline(row, row['oid'])
            cls.original = inspection.normalized(row)
            cls.oid = row['oid']
        except BaseException:
            if not cls._class_cleanups:
                cls.admin.close()
            raise

    @classmethod
    def clear_fixture(cls):
        try:
            cls.admin.run('DROP DATABASE IF EXISTS recovery_pr14_7955d1df WITH (FORCE)')
            cls.admin.run('DROP DATABASE IF EXISTS neondb WITH (FORCE)')
            cls.admin.run('DROP ROLE cloud_admin, neondb_owner, recovery_restore_pr14_7955d1df')
        finally:
            cls.admin.close()

    def restored(self):
        row = inspection.baseline(self.inspector)
        self.assertEqual(inspection.normalized(row), self.original)
        self.assertEqual(row['sessions'], 0)

    def run_case(self, scenario):
        self.restored()
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory) / 'fixture.json'
            fixture.write_text(json.dumps({'settings': self.settings, 'oid': self.oid, 'scenario': scenario}))
            return subprocess.run([sys.executable, '-I', __file__, '--subject', '--approval',
                                   inspection.APPROVAL, '--passfile', str(fixture)],
                                  capture_output=True, text=True, timeout=35)

    def test_success(self):
        result = self.run_case('normal')
        self.assertEqual(result.returncode, 0, result.stderr)
        evidence = json.loads(result.stdout)
        self.assertEqual(evidence['inventory']['relations'], 0)
        self.assertFalse(evidence['owner_login'])
        self.restored()

    def test_target_connection_failure(self):
        result = self.run_case('connect-failure')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(result.stdout)
        self.restored()

    def test_unready_watchdog_leaves_baseline(self):
        result = self.run_case('unready')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('watchdog not ready', result.stderr)
        self.restored()

    def test_watchdog_timeout_revokes(self):
        result = self.run_case('watchdog-timeout')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(result.stdout)
        self.restored()

    def test_interrupt_restores(self):
        result = self.run_case('interrupted')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Inspection interrupted', result.stderr)
        self.restored()

    def test_orphaned_watchdog_revokes_after_hard_death(self):
        result = self.run_case('parent-killed')
        self.assertEqual(result.returncode, -signal.SIGKILL)
        deadline = time.monotonic() + 8
        while inspection.normalized(inspection.baseline(self.inspector)) != self.original:
            self.assertLess(time.monotonic(), deadline, 'Orphaned watchdog did not revoke')
            time.sleep(0.1)
        self.restored()

    def test_cleanup_failure_never_reports_success(self):
        try:
            result = self.run_case('cleanup-failure')
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('CLEANUP UNVERIFIED', result.stderr)
            self.assertFalse(result.stdout)
            self.assertTrue(inspection.baseline(self.inspector)['connect'])
        finally:
            inspection.revoke(self.inspector, self.original, self.oid)
        self.restored()


if __name__ == '__main__':
    if '--subject' in sys.argv or '--watchdog' in sys.argv:
        sys.exit(run_subject())
    unittest.main()
