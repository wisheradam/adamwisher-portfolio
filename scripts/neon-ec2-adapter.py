"""Trusted EC2 runtime adapter. Invoke through official asm-exec; never from Work/CI."""
import contextlib,hashlib,importlib.util,json,os,platform,resource,shutil,socket,subprocess,tempfile
from pathlib import Path
import urllib.request
s=importlib.util.spec_from_file_location('core',Path(__file__).with_name('neon-macos-recovery.py'));core=importlib.util.module_from_spec(s);s.loader.exec_module(core)
s=importlib.util.spec_from_file_location('protocol',Path(__file__).with_name('neon-ec2-protocol.py'));protocol=importlib.util.module_from_spec(s);s.loader.exec_module(protocol)

def pipeline(commands,env):
 children=[]
 try:
  for command in commands:
   previous=children[-1] if children else None
   child=subprocess.Popen(command,stdin=previous.stdout if previous else subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,env=env)
   if previous: previous.stdout.close()
   children.append(child)
  result=children[-1].stdout.read()
  core.require(all(p.wait()==0 for p in children),'Authenticated archive pipeline failed')
  return result
 finally:
  for child in children:
   if child.poll() is None: child.terminate();child.wait()
   if child.stdout:child.stdout.close()


class Adapter:
 def __init__(self,aws,plan,config,root):
  self.aws=aws;self.plan=plan;self.config=config;self.root=Path(root);self.private=[];self.upload=None
 def attest(self,plan):
  core.require(platform.system()=='Linux' and not os.environ.get('CI'), 'Trusted EC2 Linux only')
  core.require(not any(os.environ.get(k) for k in ['AWS_ACCESS_KEY_ID','AWS_PROFILE','AWS_WEB_IDENTITY_TOKEN_FILE','AWS_CONFIG_FILE','AWS_SHARED_CREDENTIALS_FILE','AWS_CONTAINER_CREDENTIALS_FULL_URI','AWS_CONTAINER_CREDENTIALS_RELATIVE_URI','AWS_ENDPOINT_URL','ASM_EXEC_MCP_ENDPOINT','AWS_SECRETS_MANAGER_AGENT_ENDPOINT','PYTHONPATH','NODE_OPTIONS','LD_PRELOAD','HTTPS_PROXY','HTTP_PROXY']),'Instance role credentials required')
  resource.setrlimit(resource.RLIMIT_CORE,(0,0))
  core.require('Ubuntu' in Path('/etc/os-release').read_text() and '24.04' in Path('/etc/os-release').read_text(),'Ubuntu 24.04 required')
  core.require(self.root.is_dir() and self.root.stat().st_mode&0o777==0o700,'Private runtime directory required')
  mounts=Path('/proc/mounts').read_text();core.require(any(x.split()[1]=='/run' and x.split()[2]=='tmpfs' for x in mounts.splitlines()),'Private secrets must use /run tmpfs')
  core.require(not Path('/proc/swaps').read_text().splitlines()[1:],'Swap prohibited')
  opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
  req=urllib.request.Request('http://169.254.169.254/latest/api/token',method='PUT',headers={'X-aws-ec2-metadata-token-ttl-seconds':'60'})
  token=opener.open(req,timeout=3).read().decode()
  doc=json.loads(opener.open(urllib.request.Request('http://169.254.169.254/latest/dynamic/instance-identity/document',headers={'X-aws-ec2-metadata-token':token}),timeout=3).read())
  core.require(doc['accountId']==plan['account'] and doc['region']==plan['region'] and doc['instanceType']=='t3.small','Instance identity mismatch')
  state=self.aws.client('ec2',region_name=plan['region']).describe_instances(InstanceIds=[doc['instanceId']])['Reservations'][0]['Instances'][0]
  core.require(state['MetadataOptions']['HttpTokens']=='required' and state['ImageId']==plan['ami'],'Instance settings mismatch')
  groups=self.aws.client('ec2',region_name=plan['region']).describe_security_groups(GroupIds=[g['GroupId'] for g in state['SecurityGroups']])['SecurityGroups']
  core.require(groups and all(not g['IpPermissions'] for g in groups),'Inbound networking prohibited')
  expected={(443,'0.0.0.0/0'),(5432,plan['source_cidr']),(5432,plan['target_cidr'])}
  observed={(p.get('FromPort'),r['CidrIp']) for g in groups for p in g['IpPermissionsEgress'] for r in p.get('IpRanges',[])}
  core.require(observed==expected and all(p.get('IpProtocol')=='tcp' and p.get('FromPort')==p.get('ToPort') and not p.get('Ipv6Ranges') and not p.get('PrefixListIds') and not p.get('UserIdGroupPairs') for g in groups for p in g['IpPermissionsEgress']),'Egress drift detected')
  volumes=self.aws.client('ec2',region_name=plan['region']).describe_volumes(VolumeIds=[d['Ebs']['VolumeId'] for d in state['BlockDeviceMappings']])['Volumes']
  core.require(volumes and all(v['Encrypted'] for v in volumes),'Every EBS volume must be encrypted')
  core.require(all(d['Ebs'].get('DeleteOnTermination') for d in state['BlockDeviceMappings']),'EBS deletion policy mismatch')
  core.require(plan['object_key'].startswith('recovery/') and len(plan['object_key'])<512,'Dedicated object prefix required')
  protocol.verify_dns(plan)
  for tool in ['psql','pg_dump','pg_restore']:
   core.require(' 18.' in core.run([tool,'--version']).decode(),'PostgreSQL 18 clients required')
  core.require(shutil.which('age'),'age missing')
 def preflight(self,plan):
  # Reuse catalog safety checks without invoking or changing macOS environment guards.
  src,dst=[json.loads(core.sql(self.config,k,core.CATALOG)) for k in ['source','target']]
  core.require(all(180000<=x['version']<190000 and not x['elevated'] and not x['neon_admin'] for x in [src,dst]),'Database roles/version unsafe')
  core.require(src['writable']==0 and src['unreadable']==0 and not src['db_owner'] and not src['db_create'] and src['schema_create']==0 and src['unsupported']==0 and src['large_objects']==0 and src['sequence_access_failures']==0 and src['ledger']>0,'Source privileges/scope unsafe')
  core.require(dst['relations']==0 and dst['extra_schemas']==0 and dst['user_routines']==0 and dst['db_create'],'Target not empty or writable')
 def verify_independent_key(self):
  # Vault key is a separate retained secret. Check its version identity, never fetch values here.
  meta=self.aws.client('secretsmanager',region_name=self.plan['region']).describe_secret(SecretId=self.plan['key_secret_arn'])
  version=self.plan['key_version'];stage='RECOVERY_'+version.replace('-','')
  core.require(stage in meta['VersionIdsToStages'].get(version,[]) and sum(stage in labels for labels in meta['VersionIdsToStages'].values())==1,'Pinned recovery key version missing')
  marker=b'recovery-key-proof';cipher=core.run(['age','-r',self.config['recipient']],input_bytes=marker)
  core.require(core.run(['age','-d','-i',self.config['identity_file']],input_bytes=cipher)==marker,'Key does not match archive recipient')
 def empty_target(self): return json.loads(core.sql(self.config,'target',core.CATALOG))['relations']==0
 @contextlib.contextmanager
 def source_snapshot(self):
  p=subprocess.Popen(['psql','-XqAtw','-v','ON_ERROR_STOP=1','-d','service='+self.config['source_service']],env=core.safe_env(self.config),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
  try:
   p.stdin.write(b'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SELECT pg_export_snapshot();\n');p.stdin.flush();snap=p.stdout.readline().decode().strip();core.require(bool(__import__('re').fullmatch('[a-fA-F0-9-]+',snap)),'Snapshot failed');yield snap
  finally:
   if p.poll() is None:p.terminate()
   p.wait();p.stdin.close();p.stdout.close()
 def integrity(self,side,snapshot):
  return (core.fingerprint(self.config,side,snapshot),core.schema_digest(self.config,side,snapshot),core.sequence_state(self.config,side))
 def s3(self): return self.aws.client('s3',region_name=self.plan['region'])
 def upload_encrypted(self,snapshot):
  # Encrypted bytes stream to multipart S3. No plaintext archive or ciphertext file.
  client=self.s3();bucket=self.plan['bucket'];key=self.plan['object_key']
  upload=client.create_multipart_upload(Bucket=bucket,Key=key,ServerSideEncryption='AES256',Metadata={'recovery-fingerprint':protocol.fingerprint(self.plan)});self.upload=(bucket,key,upload['UploadId'])
  env=core.safe_env(self.config)
  dump=subprocess.Popen(['pg_dump','-w','-Fc','--no-owner','--no-privileges','--snapshot='+snapshot,'-d','service='+self.config['source_service']],env=env,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
  age=subprocess.Popen(['age','-r',self.config['recipient']],stdin=dump.stdout,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL);dump.stdout.close();parts=[]
  try:
   total=0
   while True:
    block=age.stdout.read(8*1024*1024)
    if not block: break
    total+=len(block);core.require(total<=1024**3,'Archive size limit exceeded')
    n=len(parts)+1;v=client.upload_part(Bucket=bucket,Key=key,UploadId=upload['UploadId'],PartNumber=n,Body=block);parts.append({'PartNumber':n,'ETag':v['ETag']})
   core.require(age.wait()==0 and dump.wait()==0 and bool(parts),'Encrypted dump pipeline failed')
   v=client.complete_multipart_upload(Bucket=bucket,Key=key,UploadId=upload['UploadId'],MultipartUpload={'Parts':parts});self.upload=None
   core.require(bool(v.get('VersionId')),'Versioned S3 completion required');return v['VersionId']
  finally:
   for p in [age,dump]:
    if p.poll() is None:p.terminate();p.wait()
    if p.stdout:p.stdout.close()
 def verify_retained(self,version):
  r=self.s3().head_object(Bucket=self.plan['bucket'],Key=self.plan['object_key'],VersionId=version,ExpectedBucketOwner=self.plan['account'])
  core.require(r['VersionId']==version and r.get('Metadata',{}).get('recovery-fingerprint')==protocol.fingerprint(self.plan),'Archive identity mismatch')
  core.require(0<r['ContentLength']<=1024**3 and r.get('ServerSideEncryption')=='AES256','Retained encrypted archive invalid')
 def fetch_version(self,version):
  archive_root=Path('/var/lib/neon-recovery') if self.plan.get('ec2_runtime') else self.root
  archive_root.mkdir(mode=0o700,parents=True,exist_ok=True)
  core.require(not archive_root.is_symlink() and archive_root.stat().st_mode&0o777==0o700,'Private ciphertext storage required')
  fd,name=tempfile.mkstemp(dir=archive_root,suffix='.age');os.close(fd);self.private.append(Path(name))
  stream=self.s3().get_object(Bucket=self.plan['bucket'],Key=self.plan['object_key'],VersionId=version,ExpectedBucketOwner=self.plan['account'])['Body']
  try:
   with open(name,'wb') as out: shutil.copyfileobj(stream,out)
  finally: stream.close()
  return name
 def authenticate(self,archive):
  pipeline([['age','-d','-i',self.config['identity_file'],archive],['pg_restore','--list']],core.safe_env(self.config))
 def restore_transactionally(self,archive):
  protocol.verify_dns(self.plan)
  pipeline([['age','-d','-i',self.config['identity_file'],archive],['pg_restore','-w','--single-transaction','--exit-on-error','--no-owner','--no-privileges','-d','service='+self.config['target_service']]],core.safe_env(self.config))
 def abort_incomplete_uploads(self):
  if self.upload:
   b,k,u=self.upload;self.s3().abort_multipart_upload(Bucket=b,Key=k,UploadId=u);self.upload=None
 def clean_private_temporary_storage(self):
  for p in self.private:p.unlink(missing_ok=True)
  core.require(all(not p.exists() for p in self.private),'Private cleanup failed')
