#!/usr/bin/env python3
"""Runtime entry point. Secret environment is supplied by official asm-exec only."""
import argparse,configparser,hashlib,importlib.util,json,os,shutil,sys,tempfile
from pathlib import Path
s=importlib.util.spec_from_file_location('adapter',Path(__file__).with_name('neon-ec2-adapter.py'));a=importlib.util.module_from_spec(s);s.loader.exec_module(a)

def validate_services(plan,config,services):
 a.core.require(not services.defaults(),'No service defaults')
 # Only Linux/EC2 accepts a reviewed hostaddr pin. The shared macOS validator is unchanged.
 checked=configparser.ConfigParser(interpolation=None)
 for section in services.sections():checked[section]={k:v for k,v in services[section].items() if k!='hostaddr'}
 a.core.validate_plan({**plan,**config,'target_endpoint':plan['target_endpoint'].split('.')[0]},checked)
 for side in ['source','target']:
  service=services[config[side+'_service']]
  a.core.require(service['host']==plan[side+'_endpoint'] and service['dbname']==plan[side+'_database'],'Database identity mismatch')
  if side+'_dns_answers' in plan or 'hostaddr' in service:
   _,pin=a.protocol.approved_dns(plan,side)
   a.core.require(service.get('hostaddr')==pin,'Exact reviewed hostaddr required')
  if side=='target' and plan.get('target_role'):a.core.require(service['user']==plan['target_role'],'Restore role mismatch')

def main():
 os.umask(0o077)
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['preflight','recover']);p.add_argument('--plan',required=True);p.add_argument('--approval',default='');args=p.parse_args()
 root=None
 try:
  a.core.require(sys.platform.startswith('linux') and not os.environ.get('CI'),'Trusted EC2 only')
  plan=json.loads(a.core.private_file(args.plan).read_text());a.protocol.fingerprint(plan)
  a.core.require(plan.get('ec2_runtime') is True,'Explicit EC2 runtime plan required')
  # Dynamic references are resolved outside this process by official asm-exec.
  # No Secrets Manager values are fetched by this program or printed.
  material=json.loads(os.environ.pop('RECOVERY_CONFIGURATION'))
  identity=os.environ.pop('RECOVERY_IDENTITY')
  a.core.require(os.path.ismount('/run'),'tmpfs runtime required')
  root=Path(tempfile.mkdtemp(prefix='neon-recovery-',dir='/run'))
  for name,value in [('pg_service.conf',material['service_file']),('pgpass',material['pass_file']),('identity',identity)]:
   path=root/name;path.write_text(value);path.chmod(0o600)
  config={'source_service':plan['source_service'],'target_service':plan['target_service'],'recipient':plan['recipient'],'identity_file':str(root/'identity'),'service_file':str(root/'pg_service.conf'),'pass_file':str(root/'pgpass')}
  services=configparser.ConfigParser(interpolation=None);services.read(config['service_file'])
  validate_services(plan,config,services)
  import re
  entries=[re.split(r'(?<!\\):',line) for line in material['pass_file'].splitlines() if line and not line.startswith('#')]
  expected={(services[k]['host'],'5432',services[k]['dbname'],services[k]['user']) for k in [config['source_service'],config['target_service']]}
  a.core.require(len(entries)==2 and all(len(e)==5 and tuple(e[:4]) in expected and e[4] for e in entries),'Exact passfile entries required')
  import boto3
  adapter=a.Adapter(boto3,plan,config,root);adapter.attest(plan);adapter.preflight(plan);adapter.verify_independent_key()
  observed={side:json.loads(a.core.sql(config,side,a.core.CATALOG)) for side in ['source','target']}
  plan['verified_permissions']=observed
  plan['verified_services_sha256']=hashlib.sha256(json.dumps({k:dict(services[k]) for k in services.sections()},sort_keys=True).encode()).hexdigest()
  approved=a.protocol.fingerprint(plan)
  spec=importlib.util.spec_from_file_location('ownership',Path(__file__).with_name('neon-ec2-ownership.py'));ownership=importlib.util.module_from_spec(spec);spec.loader.exec_module(ownership)
  if args.mode=='preflight':
   ownership.save(Path(args.plan),plan)
   print(json.dumps({'status':'PREFLIGHT_PASS','fingerprint':approved,'contents_accessed':False}));return 0
  result=a.protocol.recover(adapter,plan,args.approval)
  head=adapter.s3().head_object(Bucket=plan['bucket'],Key=plan['object_key'],VersionId=result['archive_version'],ExpectedBucketOwner=plan['account'])
  receipt={**result,'fingerprint':approved,'target_endpoint':plan['target_endpoint'],'target_branch':plan['target_branch'],'target_database':plan['target_database'],'ciphertext_bytes':head['ContentLength'],'bucket':plan['bucket'],'object_key':plan['object_key'],'key_secret_arn':plan['key_secret_arn'],'key_version':plan['key_version']}
  ownership.save(Path(args.plan).with_suffix('.recovery.json'),receipt)
  print(json.dumps(result));return 0
 except Exception:
  print('STOP: controlled recovery check failed; no private diagnostics emitted.',file=sys.stderr);return 1
 finally:
  if root: shutil.rmtree(root);a.core.require(not root.exists(),'Runtime cleanup failed')
if __name__=='__main__':sys.exit(main())
