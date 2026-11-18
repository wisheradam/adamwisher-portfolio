"""Exact scope for the PR #14 synthetic-only EC2 recovery rehearsal."""
import hashlib
import json
import re

SOURCE_DATABASE = 'recovery_synthetic_source_pr14_7955d1df'
SOURCE_ROLE = 'recovery_synthetic_reader_pr14_7955d1df'
TARGET_DATABASE = 'recovery_pr14_7955d1df'
TARGET_BRANCH = 'br-withered-wildflower-b9dm0qs3'
SOURCE_ENDPOINT = 'ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech'
TARGET_ENDPOINT = 'ep-delicate-cloud-b99oh03j.c-7.eu-central-1.aws.neon.tech'
TARGET_ROLE = 'recovery_restore_pr14_7955d1df'
TABLES = sorted("""
admin_login_limits admin_schema_migrations admin_sessions admin_users audit_events
certifications education_records experience feature_flags media_assets products
projects publication_snapshots redirects releases seo_metadata timeline_events
""".split())

INVENTORY = """
WITH namespaces AS (
 SELECT oid, nspname FROM pg_namespace
 WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
)
SELECT json_build_object(
 'database', current_database(),
 'role', current_user,
 'schemas', (SELECT json_agg(nspname ORDER BY nspname) FROM namespaces),
 'tables', (SELECT json_agg(c.relname ORDER BY c.relname)
            FROM pg_class c JOIN namespaces n ON n.oid=c.relnamespace
            WHERE c.relkind='r' AND n.nspname='public' AND NOT c.relispartition),
 'unexpected_relations', (SELECT count(*) FROM pg_class c
            JOIN namespaces n ON n.oid=c.relnamespace WHERE c.relkind NOT IN ('r','i')
            OR c.relrowsecurity OR c.relispartition),
 'routines', (SELECT count(*) FROM pg_proc p JOIN namespaces n ON n.oid=p.pronamespace),
 'extensions', (SELECT json_agg(extname ORDER BY extname) FROM pg_extension),
 'large_objects', (SELECT count(*) FROM pg_largeobject_metadata)
)
"""
DUMP_OPTIONS = ['--schema=public', '--strict-names', '--no-large-objects', '--no-comments']


def check_plan(plan, require):
    values = {
        'source_database': SOURCE_DATABASE, 'source_role': SOURCE_ROLE,
        'source_endpoint': SOURCE_ENDPOINT, 'target_branch': TARGET_BRANCH,
        'target_database': TARGET_DATABASE, 'target_endpoint': TARGET_ENDPOINT,
        'target_role': TARGET_ROLE,
    }
    require(all(plan.get(key) == value for key, value in values.items()))
    proof = plan.get('synthetic_scope')
    require(isinstance(proof, dict) and set(proof) == {
        'provenance_sha256', 'schema_sha256', 'rows_sha256',
    })
    require(all(isinstance(value, str) and re.fullmatch('[a-f0-9]{64}', value)
                for value in proof.values()))
    return proof


def verify_inventory(core, plan, config, snapshot=None):
    proof = check_plan(plan, lambda ok: core.require(ok, 'Synthetic source binding required'))
    expected = {
        'database': SOURCE_DATABASE, 'role': SOURCE_ROLE, 'schemas': ['public'],
        'tables': TABLES, 'unexpected_relations': 0, 'routines': 0,
        'extensions': ['plpgsql'], 'large_objects': 0,
    }
    observed = json.loads(core.sql(config, 'source', INVENTORY, snapshot))
    core.require(observed == expected, 'Synthetic source inventory mismatch')
    digest = core.schema_digest(config, 'source', snapshot)
    core.require(digest.hex() == proof['schema_sha256'], 'Synthetic source DDL mismatch')
    return digest


def rows_digest(rows):
    # Canonicalize JSON whitespace in the existing per-table fingerprint output.
    fingerprint = json.dumps([json.loads(line) for line in rows.splitlines()],
                             separators=(',', ':'), ensure_ascii=True).encode()
    return hashlib.sha256(fingerprint).hexdigest()


def verify_rows(core, plan, rows):
    core.require(rows_digest(rows) == plan['synthetic_scope']['rows_sha256'],
                 'Synthetic fixture fingerprint mismatch')
