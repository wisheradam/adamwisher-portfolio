"""Real PostgreSQL 18 + age; synthetic data, in-memory AWS. No live endpoints."""
import contextlib,importlib.util,io,json,os,shutil,subprocess,tempfile,unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('a','scripts/neon-ec2-adapter.py');a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
def run(cmd,data=None):
 p=subprocess.run(cmd,input=data,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
 if p.returncode:raise RuntimeError('Synthetic client failure; diagnostics suppressed')
 return p.stdout
class AWS:
 def __init__(self):self.parts={};self.versions={};self.failed=False
 def client(self,service,**kw):return self
 def describe_secret(self,**kw):return {'VersionIdsToStages':{'key-v1':['AWSCURRENT']}}
 def create_multipart_upload(self,**kw):self.parts={};return {'UploadId':'upload'}
 def upload_part(self,**kw):
  if self.failed:raise RuntimeError('synthetic upload interruption')
  self.parts[kw['PartNumber']]=kw['Body'];return {'ETag':str(kw['PartNumber'])}
 def complete_multipart_upload(self,**kw):self.versions['v1']=b''.join(self.parts[k] for k in sorted(self.parts));self.parts={};return {'VersionId':'v1'}
 def abort_multipart_upload(self,**kw):self.parts={}
 def head_object(self,**kw):return {'ContentLength':len(self.versions[kw['VersionId']]),'ServerSideEncryption':'AES256'}
 def get_object(self,**kw):return {'Body':io.BytesIO(self.versions[kw['VersionId']])}
class E2E(unittest.TestCase):
 def test_roundtrip_and_corruption(self):
  container=os.environ['RECOVERY_TEST_CONTAINER']
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);bin=root/'bin';bin.mkdir()
   for tool in ['psql','pg_dump','pg_restore']:
    path=bin/tool;path.write_text('#!/bin/sh\nexec docker exec -i -e PGSERVICEFILE=/tmp/recovery_services '+container+' '+tool+' "$@"\n');path.chmod(0o700)
   env_path=os.environ['PATH'];os.environ['PATH']=str(bin)+':'+env_path
   try:
    for name in ['synthetic_source','synthetic_restore']:
     run(['docker','exec',container,'createdb','-U','postgres',name])
    service=''.join('['+k+']\nhost=127.0.0.1\nuser=postgres\npassword=isolated-ci-only\ndbname=synthetic_'+v+'\n' for k,v in [('source','source'),('target','restore')])
    (root/'services').write_text(service)
    run(['docker','cp',str(root/'services'),container+':/tmp/recovery_services'])
    for f in sorted(Path('lib/admin/migrations').glob('*.sql')):
     run([str(bin/'psql'),'-XqAtw','-v','ON_ERROR_STOP=1','-d','service=source'],f.read_bytes())
    run([str(bin/'psql'),'-XqAtw','-v','ON_ERROR_STOP=1','-d','service=source'],b"INSERT INTO admin_schema_migrations(version) VALUES('001_init'),('002_security'),('003_apps_publishing'),('004_modules'),('005_publication_snapshots');")
    seed="""INSERT INTO experience(id,company,title,status,visibility,created_at,updated_at,updated_by) VALUES('synthetic','Synthetic','Draft v2','DRAFT','PUBLIC','2026-01-01','2026-01-01','fixture');
INSERT INTO publication_snapshots(entity_type,entity_id,payload,revision,published_at,published_by) VALUES('experience','synthetic','{"title":"Public v1"}',1,'2026-01-01','fixture');
INSERT INTO admin_users(id,email,password_hash,role,created_at,updated_at) VALUES('synthetic','synthetic@example.test','synthetic-not-a-real-password','READ_ONLY','2026-01-01','2026-01-01');
INSERT INTO admin_sessions(token_hash,user_id,session_version,expires_at,created_at) VALUES('synthetic-not-real','synthetic',1,'2027-01-01','2026-01-01');
INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,created_at) VALUES('synthetic','fixture','PUBLISHED','experience','synthetic','2026-01-01');"""
    run([str(bin/'psql'),'-XqAtw','-v','ON_ERROR_STOP=1','-d','service=source'],seed.encode())
    run(['age-keygen','-o',str(root/'identity')]);recipient=run(['age-keygen','-y',str(root/'identity')]).decode().strip()
    cfg=dict(source_service='source',target_service='target',recipient=recipient,identity_file=str(root/'identity'),service_file=str(root/'services'),pass_file=str(root/'unused'))
    plan=dict(region='eu-central-1',bucket='synthetic',object_key='recovery/synthetic',key_secret_arn='synthetic',key_version='key-v1')
    aws=AWS();adapter=a.Adapter(aws,plan,cfg,root)
    adapter.verify_independent_key()
    with adapter.source_snapshot() as snapshot:
     before=adapter.integrity('source',snapshot);version=adapter.upload_encrypted(snapshot)
    self.assertTrue(aws.versions[version].startswith(b'age-encryption.org/v1'))
    adapter.verify_retained(version);archive=adapter.fetch_version(version);adapter.authenticate(archive);adapter.restore_transactionally(archive)
    self.assertEqual(before,adapter.integrity('target',None))
    # Independent retained AWS state survives removal of original runtime adapter.
    adapter.clean_private_temporary_storage();del adapter
    new=a.Adapter(aws,plan,cfg,root);new.verify_independent_key();archive=new.fetch_version(version);new.authenticate(archive)
    Path(archive).write_bytes(Path(archive).read_bytes()[:-12])
    with self.assertRaises(RuntimeError):new.authenticate(archive)
    new.clean_private_temporary_storage();self.assertFalse(Path(archive).exists())
    aws.failed=True
    with new.source_snapshot() as snapshot:
     with self.assertRaises(RuntimeError):new.upload_encrypted(snapshot)
    new.abort_incomplete_uploads();self.assertFalse(aws.parts)
    print('Synthetic real PostgreSQL18/age restore and independent-adapter recovery passed; corrupt archive and interrupted upload rejected.')
   finally:
    os.environ['PATH']=env_path
    for name in ['synthetic_source','synthetic_restore']:
     subprocess.run(['docker','exec',container,'dropdb','-U','postgres','--force','--if-exists',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    subprocess.run(['docker','exec',container,'rm','-f','/tmp/recovery_services'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
if __name__=='__main__':unittest.main()
