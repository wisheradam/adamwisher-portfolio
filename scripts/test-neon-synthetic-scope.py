"""Offline regression tests for the clean synthetic source approval boundary."""
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import Mock

spec = importlib.util.spec_from_file_location(
    'adapter', Path(__file__).with_name('neon-ec2-adapter.py'))
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)
scope = adapter.scope


class ScopeTests(unittest.TestCase):
    def setUp(self):
        self.plan = {
            'source_database': scope.SOURCE_DATABASE, 'source_role': scope.SOURCE_ROLE,
            'source_endpoint': scope.SOURCE_ENDPOINT, 'target_branch': scope.TARGET_BRANCH,
            'target_database': scope.TARGET_DATABASE, 'target_endpoint': scope.TARGET_ENDPOINT,
            'target_role': scope.TARGET_ROLE,
            'synthetic_scope': {'provenance_sha256': 'b' * 64, 'schema_sha256': 'a' * 64,
                                'rows_sha256': scope.rows_digest('["public.example", 1, "expected"]')},
        }
        self.catalog = {
            'database': scope.SOURCE_DATABASE, 'role': scope.SOURCE_ROLE, 'schemas': ['public'],
            'tables': scope.TABLES, 'unexpected_relations': 0, 'routines': 0,
            'extensions': ['plpgsql'], 'large_objects': 0,
        }

    def test_exact_plan_bindings(self):
        self.assertEqual(scope.check_plan(self.plan, adapter.protocol.require),
                         self.plan['synthetic_scope'])
        for key, bad_value in {
            'source_database': 'neondb', 'source_role': 'owner', 'source_endpoint': 'different',
            'target_branch': 'different', 'target_database': 'neondb',
            'target_endpoint': 'different', 'target_role': 'owner', 'synthetic_scope': {},
        }.items():
            with self.subTest(key=key), self.assertRaises(adapter.protocol.Stop):
                scope.check_plan({**self.plan, key: bad_value}, adapter.protocol.require)

    def test_inventory_drift_rejected_before_schema_dump(self):
        for key, bad_value in {
            'database': 'neondb', 'schemas': ['public', 'unexpected'],
            'tables': scope.TABLES[:-1] + ['substitution'], 'unexpected_relations': 1,
            'routines': 1, 'extensions': ['plpgsql', 'extra'], 'large_objects': 1,
        }.items():
            with self.subTest(key=key):
                core = Mock(wraps=adapter.core)
                core.sql.return_value = json.dumps({**self.catalog, key: bad_value})
                with self.assertRaises(RuntimeError):
                    scope.verify_inventory(core, self.plan, {}, '10-2')
                core.schema_digest.assert_not_called()

    def test_schema_and_fixture_proofs(self):
        core = Mock(wraps=adapter.core)
        core.sql.return_value = json.dumps(self.catalog)
        core.schema_digest.return_value = bytes.fromhex('a' * 64)
        scope.verify_inventory(core, self.plan, {}, '10-2')
        core.sql.assert_called_once_with({}, 'source', scope.INVENTORY, '10-2')
        core.schema_digest.assert_called_once_with({}, 'source', '10-2')
        core.schema_digest.return_value = bytes.fromhex('b' * 64)
        with self.assertRaisesRegex(RuntimeError, 'DDL mismatch'):
            scope.verify_inventory(core, self.plan, {}, '10-2')
        scope.verify_rows(adapter.core, self.plan, '["public.example",1,"expected"]')
        with self.assertRaisesRegex(RuntimeError, 'fingerprint mismatch'):
            scope.verify_rows(adapter.core, self.plan, '["public.example",1,"replacement"]')

    def test_unverified_snapshot_cannot_start_upload(self):
        aws = Mock()
        runtime = adapter.Adapter(aws, self.plan, {}, '/tmp')
        for snapshot in (None, '10-2'):
            with self.subTest(snapshot=snapshot), self.assertRaisesRegex(RuntimeError, 'unverified'):
                runtime.upload_encrypted(snapshot)
        aws.client.assert_not_called()


if __name__ == '__main__':
    unittest.main()
