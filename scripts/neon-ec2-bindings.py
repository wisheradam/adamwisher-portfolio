"""Bind runtime to newly created, verified vault/runner receipts; metadata reads only."""
import importlib.util,re
from pathlib import Path
s=importlib.util.spec_from_file_location('own',Path(__file__).with_name('neon-ec2-ownership.py'));o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
s=importlib.util.spec_from_file_location('stacks',Path(__file__).parents[1]/'infra/recovery/stacks.py');stacks=importlib.util.module_from_spec(s);s.loader.exec_module(stacks)
def verify(boto,runtime,initializing=False):
 plan=runtime['provisioning_plan'];receipt=runtime['ownership_receipt'];o.validate(plan)
 o.check(receipt['run_id']==plan['run_id'] and runtime['ownership_fingerprint']==o.digest(receipt))
 cfn=boto.client('cloudformation',region_name=o.REGION)
 vault=o.vault(boto,cfn,plan,receipt,stacks.stacks()['vault'])
 runner,resources=o.stack(cfn,plan,receipt,'runner',stacks.stacks()['runner']);out=o.outputs(runner)
 o.check(runner['StackStatus']=='CREATE_COMPLETE' and out==receipt['runner_outputs'])
 o.check(out['RunnerRoleName']==resources['Role']['PhysicalResourceId'])
 o.check(out['DatabaseSecretArn']==resources['DatabaseSecretArn']['PhysicalResourceId'])
 o.check(runtime['bucket']==vault['Bucket'] and runtime['key_secret_arn']==vault['KeySecretArn'] and runtime['configuration_secret_arn']==out['DatabaseSecretArn'])
 actual={p['ParameterKey']:p['ParameterValue'] for p in runner['Parameters']}
 o.check(actual==plan['parameters'])
 for parameter,key in [('ReviewedAmi','ami'),('SourceCidr','source_cidr'),('TargetCidr','target_cidr')]:o.check(runtime[key]==actual[parameter])
 o.check(actual['ArchiveBucket']==vault['Bucket'] and actual['KeySecretArn']==vault['KeySecretArn'] and actual['VaultStackId']==receipt['vault']['stack_id'])
 if initializing:
  init,_=o.stack(cfn,plan,receipt,'initializer',stacks.stacks()['initializer'])
  o.check(init['StackStatus']=='CREATE_COMPLETE' and not receipt.get('initializer_removed'))
 else:
  o.check(receipt.get('initializer_removed') is True)
  removed=cfn.describe_stacks(StackName=receipt['initializer']['stack_id'])['Stacks'][0]
  o.check(removed['StackStatus']=='DELETE_COMPLETE' and removed['StackId']==receipt['initializer']['stack_id'])
 return out

def stage(version):
 o.check(re.fullmatch(r'[a-f0-9-]{32,36}',version));return 'RECOVERY_'+version.replace('-','')
def references(plan,sm):
 result={}
 for environment,arn,version in [('RECOVERY_CONFIGURATION',plan['configuration_secret_arn'],plan['configuration_version']),('RECOVERY_IDENTITY',plan['key_secret_arn'],plan['key_version'])]:
  o.check(re.fullmatch(r'arn:aws:secretsmanager:eu-central-1:533267008693:secret:[A-Za-z0-9/_+=.@-]+',arn))
  label=stage(version);meta=sm.describe_secret(SecretId=arn)
  o.check(meta['ARN']==arn and not meta.get('DeletedDate'))
  o.check(label in meta['VersionIdsToStages'].get(version,[]))
  o.check(sum(label in labels for labels in meta['VersionIdsToStages'].values())==1)
  result[environment]='{{resolve:secretsmanager:'+arn+':SecretString::'+label+'}}'
 return result
