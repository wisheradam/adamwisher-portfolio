"""Non-secret ownership receipts. Never adopts a stack on its name/tags alone."""
import hashlib,json,re,os,tempfile
from pathlib import Path
ACCOUNT='533267008693';REGION='eu-central-1'
def check(value):
 if not value:raise ValueError('Ownership gate failed')
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
def save(path,value):
 path=Path(path)
 # A killed writer must not leave a fixed .pending name that blocks all retries.
 fd,temporary=tempfile.mkstemp(prefix='.'+path.name+'.',suffix='.pending',dir=path.parent)
 try:
  with os.fdopen(fd,'w') as stream:
   json.dump(value,stream);stream.flush();os.fsync(stream.fileno())
  os.replace(temporary,path)
  directory=os.open(path.parent,os.O_RDONLY)
  try:os.fsync(directory)
  finally:os.close(directory)
 finally:
  if os.path.exists(temporary):os.unlink(temporary)
def validate(plan):
 check(plan['account']==ACCOUNT and plan['region']==REGION)
 check(re.fullmatch(r'[a-f0-9]{32}',plan['run_id']))
 for key,prefix in [('vault_stack','adam-neon-vault-'),('runner_stack','adam-neon-recovery-')]:
  check(re.fullmatch(prefix+r'[a-zA-Z0-9-]{1,70}',plan[key]))
def tags(plan,kind):return [{'Key':'Purpose','Value':'adamwisher-neon-recovery'+{'vault':'-vault','runner':'','initializer':'-key-init'}[kind]},{'Key':'RecoveryRun','Value':plan['run_id']}]
def name(plan,kind):return plan['vault_stack'] if kind=='vault' else plan['runner_stack']+('-key-initializer' if kind=='initializer' else '')
def stack(cfn,plan,receipt,kind,template):
 item=receipt[kind];sid=item['stack_id']
 check(sid.startswith(f'arn:aws:cloudformation:{REGION}:{ACCOUNT}:stack/{name(plan,kind)}/'))
 actual=cfn.describe_stacks(StackName=sid)['Stacks'][0]
 check(actual['StackId']==sid and actual['StackName']==name(plan,kind))
 check(all(t in actual.get('Tags',[]) for t in tags(plan,kind)))
 body=cfn.get_template(StackName=sid,TemplateStage='Original')['TemplateBody']
 if isinstance(body,str):body=json.loads(body)
 check(digest(body)==digest(template)==item['template_sha256'])
 resources={}
 for page in cfn.get_paginator('list_stack_resources').paginate(StackName=sid):
  resources.update({r['LogicalResourceId']:r for r in page['StackResourceSummaries'] if r.get('PhysicalResourceId')})
 return actual,resources
def outputs(actual):return {o['OutputKey']:o['OutputValue'] for o in actual.get('Outputs',[])}
def vault(boto,cfn,plan,receipt,template):
 actual,resources=stack(cfn,plan,receipt,'vault',template)
 check(actual['StackStatus']=='CREATE_COMPLETE')
 out=outputs(actual)
 check(set(out)=={'Bucket','KeySecretArn'})
 check(out['Bucket']==resources['Archive']['PhysicalResourceId'])
 check(out['KeySecretArn']==resources['RecoveryIdentity']['PhysicalResourceId'])
 s3=boto.client('s3',region_name=REGION);args={'Bucket':out['Bucket'],'ExpectedBucketOwner':ACCOUNT}
 s3.head_bucket(**args)
 check(s3.get_bucket_versioning(**args)['Status']=='Enabled')
 check(all(s3.get_public_access_block(**args)['PublicAccessBlockConfiguration'].get(k) is True for k in ['BlockPublicAcls','IgnorePublicAcls','BlockPublicPolicy','RestrictPublicBuckets']))
 rules=s3.get_bucket_encryption(**args)['ServerSideEncryptionConfiguration']['Rules']
 check(any(r['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']=='AES256' for r in rules))
 policy=json.loads(s3.get_bucket_policy(**args)['Policy'])
 check(any(s.get('Effect')=='Deny' and s.get('Principal')=='*' and s.get('Action')=='s3:*' and s.get('Condition',{}).get('Bool',{}).get('aws:SecureTransport')=='false' and f"arn:aws:s3:::{out['Bucket']}/*" in s.get('Resource',[]) for s in policy['Statement']))
 secret=boto.client('secretsmanager',region_name=REGION).describe_secret(SecretId=out['KeySecretArn'])
 check(secret['ARN']==out['KeySecretArn'] and not secret.get('DeletedDate'))
 return out

def retained(boto,plan,out):
 proof=plan['retained'];check(proof['bucket']==out['Bucket'] and proof['key_secret_arn']==out['KeySecretArn'])
 check(proof['object_key'].startswith('recovery/') and proof['archive_version'] not in ['', 'null'])
 head=boto.client('s3',region_name=REGION).head_object(Bucket=out['Bucket'],Key=proof['object_key'],VersionId=proof['archive_version'],ExpectedBucketOwner=ACCOUNT)
 check(head['VersionId']==proof['archive_version'] and head['ServerSideEncryption']=='AES256' and 0<head['ContentLength']<=1024**3)
 check(head['ContentLength']==proof['ciphertext_bytes'])
 check(head.get('Metadata',{}).get('recovery-fingerprint')==proof['recovery_fingerprint'])
 key=boto.client('secretsmanager',region_name=REGION).describe_secret(SecretId=out['KeySecretArn'])
 version=proof['key_version'];stage='RECOVERY_'+version.replace('-','')
 check(re.fullmatch(r'[a-f0-9-]{32,36}',version) and key['ARN']==out['KeySecretArn'] and not key.get('DeletedDate'))
 check(stage in key['VersionIdsToStages'].get(version,[]))
 check(sum(stage in labels for labels in key['VersionIdsToStages'].values())==1)
 check(proof['independent_key_recovery_verified'] is True and proof['application_acceptance_verified'] is True)
 return {'archive_version_verified':True,'key_version_verified':True}
