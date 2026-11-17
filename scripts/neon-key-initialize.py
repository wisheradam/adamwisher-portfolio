"""Run on the approved EC2 only with temporary single-secret initialization permission.
No key material enters arguments, files, command output or diagnostic logs.
"""
import argparse,json,os,platform,subprocess,sys,uuid,tempfile,shutil,importlib.util
from pathlib import Path
s=importlib.util.spec_from_file_location('a',Path(__file__).with_name('neon-ec2-adapter.py'));adapter=importlib.util.module_from_spec(s);s.loader.exec_module(adapter)

def main():
 p=argparse.ArgumentParser();p.add_argument('--secret-arn',required=True);p.add_argument('--plan',required=True);a=p.parse_args()
 try:
  if platform.system()!='Linux' or os.environ.get('CI'):raise RuntimeError()
  if not a.secret_arn.startswith('arn:aws:secretsmanager:eu-central-1:533267008693:secret:'):raise RuntimeError()
  import boto3
  plan=json.loads(adapter.core.private_file(a.plan).read_text());adapter.protocol.fingerprint(plan)
  if a.secret_arn!=plan['key_secret_arn']:raise RuntimeError()
  root=Path(tempfile.mkdtemp(prefix='neon-key-init-',dir='/run'))
  try:adapter.Adapter(boto3,plan,{},root).attest(plan)
  finally:shutil.rmtree(root)
  sm=boto3.client('secretsmanager',region_name='eu-central-1')
  if sm.describe_secret(SecretId=a.secret_arn).get('VersionIdsToStages'):raise RuntimeError()
  key=subprocess.run(['age-keygen'],capture_output=True,check=True).stdout
  recipient=subprocess.run(['age-keygen','-y'],input=key,capture_output=True,check=True).stdout.decode().strip()
  r=sm.put_secret_value(SecretId=a.secret_arn,SecretString=key.decode(),ClientRequestToken=str(uuid.uuid4()),VersionStages=['AWSCURRENT','RECOVERY'])
  print(json.dumps({'public_recipient':recipient,'key_version':r['VersionId'],'requires':'delete initialization policy stack and verify PutSecretValue denied before C'}));return 0
 except Exception:print('STOP: key initialization failed; private diagnostics suppressed.',file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
