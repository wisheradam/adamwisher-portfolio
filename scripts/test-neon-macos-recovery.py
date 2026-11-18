"""Offline negative controls only. Never accesses a database or credentials."""
import configparser
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('recovery', Path(__file__).with_name('neon-macos-recovery.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class PlanTests(unittest.TestCase):
    def setUp(self):
        self.c = dict(source_branch=r.SOURCE_BRANCH, target_branch='br-isolated-restore',
                      source_service='source', target_service='target',
                      target_endpoint='ep-isolated-restore', recipient='age1example')
        self.services = configparser.ConfigParser(interpolation=None)
        for name, ep in [('source', r.SOURCE_ENDPOINT), ('target', 'ep-isolated-restore')]:
            self.services[name] = dict(host=ep+'.c-7.eu-central-1.aws.neon.tech', port='5432',
                                       dbname='neondb', user='scoped_role', sslmode='verify-full', sslrootcert='system')

    def test_valid_isolated_plan(self):
        r.validate_plan(self.c, self.services)

    def test_production_target_denied(self):
        self.c['target_branch'] = r.PRODUCTION_BRANCH
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_wrong_source_denied(self):
        self.c['source_branch'] = 'br-other'
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_shared_endpoint_denied(self):
        self.services['target']['host'] = self.services['source']['host']
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_password_in_service_denied(self):
        self.services['source']['password'] = 'synthetic'
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_pooled_endpoint_denied(self):
        self.services['source']['host'] = self.services['source']['host'].replace('.c-7.', '-pooler.c-7.')
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_unverified_tls_denied(self):
        self.services['source']['sslmode'] = 'require'
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_service_injection_denied(self):
        self.services['source']['options'] = '-c search_path=public'
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_connection_parameter_injection_denied(self):
        self.c['target_service'] = 'target host=unreviewed'
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_same_branch_denied(self):
        self.c['target_branch'] = r.SOURCE_BRANCH
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)

    def test_unpinned_target_denied(self):
        self.c['target_endpoint'] = 'ep-unreviewed'
        with self.assertRaises(RuntimeError): r.validate_plan(self.c, self.services)


if __name__ == '__main__':
    unittest.main()
