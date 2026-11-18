"""Real PostgreSQL 18 + age; synthetic data, in-memory AWS. No live endpoints."""
import hashlib,contextlib,importlib.util,io,json,os,shutil,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
s=importlib.util.spec_from_file_location('a','scripts/neon-ec2-adapter.py');a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
def run(cmd,data=None):
 p=subprocess.run(cmd,input=data,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 if p.returncode:raise RuntimeError('Synthetic client failure; diagnostics suppressed')
 return p.stdout
class AWS:
 def __init__(self):self.parts={};self.versions={};self.failed=False
 def client(self,service,**kw):return self
 def describe_secret(self,**kw):return {'VersionIdsToStages':{'key-v1':['AWSCURRENT','RECOVERY_keyv1']}}
 def create_multipart_upload(self,**kw):self.parts={};self.metadata=kw['Metadata'];return {'UploadId':'upload'}
 def upload_part(self,**kw):
  if self.failed:raise RuntimeError('synthetic upload interruption')
  self.parts[kw['PartNumber']]=kw['Body'];return {'ETag':str(kw['PartNumber'])}
 def complete_multipart_upload(self,**kw):self.versions['v1']=b''.join(self.parts[k] for k in sorted(self.parts));self.parts={};return {'VersionId':'v1'}
 def abort_multipart_upload(self,**kw):self.parts={}
 def head_object(self,**kw):return {'ContentLength':len(self.versions[kw['VersionId']]),'ServerSideEncryption':'AES256','VersionId':kw['VersionId'],'Metadata':self.metadata}
 def get_object(self,**kw):return {'Body':io.BytesIO(self.versions[kw['VersionId']])}
class E2E(unittest.TestCase):
 def test_roundtrip_and_corruption(self):
  container=os.environ['RECOVERY_TEST_CONTAINER']
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);runtime=root/'original-runner';runtime.mkdir(mode=0o700);bin=root/'bin';bin.mkdir()
   for tool in ['psql','pg_dump','pg_restore']:
    path=bin/tool;path.write_text('#!/bin/sh\nexec docker exec -i -e PGSERVICEFILE=/tmp/recovery_services '+container+' '+tool+' "$@"\n');path.chmod(0o700)
   env_path=os.environ['PATH'];os.environ['PATH']=str(bin)+':'+env_path
   database=a.scope.SOURCE_DATABASE;reader=a.scope.SOURCE_ROLE
   fixture=Path('scripts/neon-synthetic-fixture.sql').read_bytes()
   try:
    run(['docker','exec','-i',container,'psql','-XqAt','-v','ON_ERROR_STOP=1','-U','postgres'],f"CREATE ROLE neon_superuser; CREATE ROLE {reader} LOGIN CONNECTION LIMIT 2 PASSWORD 'isolated-ci-only'; CREATE ROLE recovery_target LOGIN CONNECTION LIMIT 1 PASSWORD 'isolated-ci-only';".encode())
    for name in [database,'synthetic_restore']:
     run(['docker','exec',container,'createdb','-U','postgres',name])
    run(['docker','exec',container,'psql','-XqAt','-v','ON_ERROR_STOP=1','-U','postgres','-c','ALTER DATABASE synthetic_restore OWNER TO recovery_target'])
    service=''.join('['+k+']\nhost=synthetic-pin-proof.invalid\nhostaddr=127.0.0.1\nuser=postgres\npassword=isolated-ci-only\ndbname='+v+'\n' for k,v in [('source',database),('target','synthetic_restore')])
    def source_sql(sql):
     return run([str(bin/'psql'),'-XqAtw','-v','ON_ERROR_STOP=1','-d','service=seed'],sql)
    (root/'services').write_text(service+'[seed]\n'+service.split('[source]\n')[1].split('[target]')[0])
    run(['docker','cp',str(root/'services'),container+':/tmp/recovery_services'])
    migrations=sorted(Path('lib/admin/migrations').glob('*.sql'))
    for f in migrations:
     source_sql(f.read_bytes())
    source_sql(b'ALTER TABLE public.admin_schema_migrations ADD COLUMN IF NOT EXISTS checksum TEXT;')
    for f in migrations:
     source_sql(f"INSERT INTO public.admin_schema_migrations(version,checksum) VALUES('{f.stem}','{hashlib.sha256(f.read_bytes()).hexdigest()}');".encode())
    source_sql(fixture)
    grants=f'GRANT CONNECT ON DATABASE {database} TO {reader}; GRANT USAGE ON SCHEMA public TO {reader}; GRANT SELECT ON '+','.join('public.'+table for table in a.scope.TABLES)+f' TO {reader};'
    source_sql(grants.encode())
    run(['age-keygen','-o',str(runtime/'identity')]);recipient=run(['age-keygen','-y',str(runtime/'identity')]).decode().strip()
    cfg=dict(source_service='source',target_service='target',recipient=recipient,identity_file=str(runtime/'identity'),service_file=str(root/'services'),pass_file=str(root/'unused'))
    plan=dict(account='533267008693',source_endpoint='localhost',target_endpoint='localhost',source_cidr='127.0.0.1/32',target_cidr='127.0.0.1/32',region='eu-central-1',bucket='synthetic',object_key='recovery/synthetic',key_secret_arn='synthetic',key_version='key-v1')
    service=service.replace('user=postgres\npassword=isolated-ci-only\ndbname='+database,'user='+reader+'\npassword=isolated-ci-only\ndbname='+database).replace('user=postgres\npassword=isolated-ci-only\ndbname=synthetic_restore','user=recovery_target\npassword=isolated-ci-only\ndbname=synthetic_restore')
    (root/'services').write_text(service+'[seed]\n'+(root/'services').read_text().split('[seed]\n')[1])
    run(['docker','cp',str(root/'services'),container+':/tmp/recovery_services'])
    aws=AWS();adapter=a.Adapter(aws,plan,cfg,runtime)
    adapter.verify_independent_key()
    with self.assertRaises(RuntimeError):run([str(bin/'psql'),'-XqAtw','-v','ON_ERROR_STOP=1','-U','synthetic_nonexistent_role','-d','service=source'],b'SELECT 1;')
    protocol_plan={**plan,'source_branch':'br-wispy-darkness-b91vydbj','source_database':database,
                   'source_role':reader,'source_endpoint':a.scope.SOURCE_ENDPOINT,'target_endpoint':a.scope.TARGET_ENDPOINT,
                   'target_database':a.scope.TARGET_DATABASE,'target_branch':a.scope.TARGET_BRANCH,'target_role':a.scope.TARGET_ROLE,
                   'synthetic_scope':{'provenance_sha256':hashlib.sha256(fixture).hexdigest(),
                                     'schema_sha256':a.core.schema_digest(cfg,'source').hex(),
                                     'rows_sha256':a.scope.rows_digest(a.core.fingerprint(cfg,'source'))}}
    adapter.plan=protocol_plan
    source_sql(b'CREATE SCHEMA unexpected;')
    with self.assertRaisesRegex(RuntimeError,'inventory mismatch'):
     adapter.preflight(protocol_plan)
    source_sql(b'DROP SCHEMA unexpected; ALTER TABLE public.experience ADD COLUMN unexpected integer;')
    with self.assertRaisesRegex(RuntimeError,'DDL mismatch'):
     adapter.preflight(protocol_plan)
    source_sql(b"ALTER TABLE public.experience DROP COLUMN unexpected; UPDATE public.experience SET title='drift';")
    with adapter.source_snapshot() as snapshot:
     with self.assertRaisesRegex(RuntimeError,'fixture fingerprint mismatch'):
      adapter.integrity('source',snapshot)
     with self.assertRaisesRegex(RuntimeError,'unverified'):
      adapter.upload_encrypted(snapshot)
    self.assertFalse(aws.parts or aws.versions)
    source_sql(b"UPDATE public.experience SET title='Draft v2';")
    # Only EC2 identity and DNS are simulated; roles, preflight SQL, snapshots, dumps, crypto and restore are real.
    with patch.object(adapter,'attest',lambda p:None),patch.object(a.protocol,'verify_dns',lambda p:None):
     receipt=a.protocol.recover(adapter,protocol_plan,a.protocol.fingerprint(protocol_plan))
    version=receipt['archive_version'];self.assertTrue(receipt['integrity_match'])
    self.assertTrue(aws.versions[version].startswith(b'age-encryption.org/v1'))
    # Independent retained AWS state survives removal of original runtime adapter.
    adapter.clean_private_temporary_storage()
    aws.retained_identity=(runtime/'identity').read_bytes()
    shutil.rmtree(runtime);del adapter;self.assertFalse(runtime.exists())
    independent=root/'independent-custodian';independent.mkdir(mode=0o700)
    (independent/'identity').write_bytes(aws.retained_identity);(independent/'identity').chmod(0o600)
    cfg={**cfg,'identity_file':str(independent/'identity')}
    new=a.Adapter(aws,protocol_plan,cfg,independent);new.verify_independent_key();archive=new.fetch_version(version);new.authenticate(archive)
    Path(archive).write_bytes(Path(archive).read_bytes()[:-12])
    with self.assertRaises(RuntimeError):new.authenticate(archive)
    new.clean_private_temporary_storage();self.assertFalse(Path(archive).exists())
    aws.failed=True
    with new.source_snapshot() as snapshot:
     new.integrity('source',snapshot)
     with self.assertRaises(RuntimeError):new.upload_encrypted(snapshot)
    new.abort_incomplete_uploads();self.assertFalse(aws.parts)
    print('Synthetic real PostgreSQL18/age restore and independent-adapter recovery passed; corrupt archive and interrupted upload rejected.')
   finally:
    os.environ['PATH']=env_path
    for name in [database,'synthetic_restore']:
     subprocess.run(['docker','exec',container,'dropdb','-U','postgres','--force','--if-exists',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['docker','exec',container,'psql','-XqAt','-U','postgres','-c',f'DROP ROLE IF EXISTS {reader}; DROP ROLE IF EXISTS recovery_target; DROP ROLE IF EXISTS neon_superuser;'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['docker','exec',container,'rm','-f','/tmp/recovery_services'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
if __name__=='__main__':unittest.main()
