#!/usr/bin/env python3
"""Owner-side gated stack control. No credential/data values are logged."""
import argparse,datetime,hashlib,importlib.util,json,sys
from pathlib import Path
s=importlib.util.spec_from_file_location('stacks',Path(__file__).parents[1]/'infra/recovery/stacks.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
ACCOUNT='533267008693';REGION='eu-central-1'
def check(ok):
 if not ok:raise RuntimeError('Control gate failed')
def digest(plan):return hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
s=importlib.util.spec_from_file_location('ownership',Path(__file__).with_name('neon-ec2-ownership.py'));o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
ACTIONS=['provision-vault','provision','provision-initializer','remove-initializer','teardown','verify']
def approval(plan,receipt,action):
 return digest({'action':action,'plan':plan,'receipt':receipt,'templates':{k:digest(v) for k,v in m.stacks().items()}})
def create(cfn,plan,receipt,path,kind,parameters=None):
 template=m.stacks()[kind];token=plan['run_id']+'-'+kind
 if kind not in receipt:
  # Persist intent BEFORE the AWS call. A crash after creation can be reconciled by its event token.
  receipt[kind]={'token':token,'template_sha256':digest(template)};o.save(path,receipt)
 item=receipt[kind];check(item['token']==token and item['template_sha256']==digest(template))
 if 'stack_id' not in item:
  # Only adopt our own interrupted create, proved by the original client request token.
  try:existing=cfn.describe_stacks(StackName=o.name(plan,kind))['Stacks'][0]
  except Exception as error:
   check(getattr(error,'response',{}).get('Error',{}).get('Code')=='ValidationError' and 'does not exist' in getattr(error,'response',{}).get('Error',{}).get('Message',''));existing=None
  if existing:
   events=cfn.describe_stack_events(StackName=existing['StackId'])['StackEvents']
   check(any(e.get('ClientRequestToken')==token and e.get('ResourceType')=='AWS::CloudFormation::Stack' for e in events))
   item['stack_id']=existing['StackId'];o.stack(cfn,plan,receipt,kind,template)
  else:
   kwargs={'StackName':o.name(plan,kind),'TemplateBody':json.dumps(template),'Tags':o.tags(plan,kind),'ClientRequestToken':token}
   if kind!='vault':kwargs.update(Capabilities=['CAPABILITY_IAM'],Parameters=[{'ParameterKey':k,'ParameterValue':v} for k,v in parameters.items()])
   item['stack_id']=cfn.create_stack(**kwargs)['StackId']
  o.save(path,receipt)
 o.stack(cfn,plan,receipt,kind,template)
 cfn.get_waiter('stack_create_complete').wait(StackName=item['stack_id'])
 o.stack(cfn,plan,receipt,kind,template)

def main():
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['plan']+ACTIONS);p.add_argument('--stage',choices=ACTIONS);p.add_argument('--plan',required=True);p.add_argument('--approval');a=p.parse_args()
 try:
  plan=json.loads(Path(a.plan).read_text());o.validate(plan)
  state_path=Path(a.plan).with_suffix('.ownership.json')
  receipt=json.loads(state_path.read_text()) if state_path.exists() else {'run_id':plan['run_id'],'intent':digest({k:plan[k] for k in ['account','region','run_id','vault_stack','runner_stack']})}
  check(receipt['run_id']==plan['run_id'] and receipt['intent']==digest({k:plan[k] for k in ['account','region','run_id','vault_stack','runner_stack']}))
  if a.mode=='plan':
   check(a.stage is not None);print(json.dumps({'stage':a.stage,'fingerprint':approval(plan,receipt,a.stage),'receipt':receipt}));return 0
  check(a.approval==approval(plan,receipt,a.mode))
  import boto3
  check(boto3.client('sts').get_caller_identity()['Account']==ACCOUNT)
  cfn=boto3.client('cloudformation',region_name=REGION)
  if a.mode=='provision-vault':
   check(not plan.get('parameters'))
   create(cfn,plan,receipt,state_path,'vault')
   out=o.vault(boto3,cfn,plan,receipt,m.stacks()['vault']);receipt['vault_outputs']=out;o.save(state_path,receipt)
   print(json.dumps({'vault_outputs':out,'next':'approve generated identifiers and runner parameters separately; no secrets populated'}));return 0
  verified_vault=o.vault(boto3,cfn,plan,receipt,m.stacks()['vault'])
  check(verified_vault==receipt['vault_outputs'])
  if a.mode=='provision':
   parameters=plan['parameters']
   check(set(parameters)=={'ReviewedAmi','ArchiveBucket','KeySecretArn','VaultStackId','SourceCidr','TargetCidr','Expiry'})
   check(parameters['ArchiveBucket']==verified_vault['Bucket'] and parameters['KeySecretArn']==verified_vault['KeySecretArn'] and parameters['VaultStackId']==receipt['vault']['stack_id'])
   expiry=datetime.datetime.fromisoformat(parameters['Expiry']).replace(tzinfo=datetime.timezone.utc)
   check(0<(expiry-datetime.datetime.now(datetime.timezone.utc)).total_seconds()<=8*3600)
   create(cfn,plan,receipt,state_path,'runner',parameters)
   runner,resources=o.stack(cfn,plan,receipt,'runner',m.stacks()['runner'])
   out=o.outputs(runner)
   check(out['RunnerRoleName']==resources['Role']['PhysicalResourceId'] and out['DatabaseSecretArn']==resources['DatabaseSecretArn']['PhysicalResourceId'])
   receipt['runner_outputs']=out;o.save(state_path,receipt)
   print(json.dumps({'runner_outputs':out,'recovery_execution_approved':False}));return 0
  if a.mode in ['provision-initializer','remove-initializer']:
   runner,resources=o.stack(cfn,plan,receipt,'runner',m.stacks()['runner']);out=o.outputs(runner)
   check(out==receipt['runner_outputs'] and out['RunnerRoleName']==resources['Role']['PhysicalResourceId'])
   if a.mode=='provision-initializer':
    check(runner['StackStatus']=='CREATE_COMPLETE')
    check(not boto3.client('secretsmanager',region_name=REGION).describe_secret(SecretId=verified_vault['KeySecretArn']).get('VersionIdsToStages'))
    create(cfn,plan,receipt,state_path,'initializer',{'RunnerRoleName':out['RunnerRoleName'],'KeySecretArn':verified_vault['KeySecretArn']})
   else:
    init,_=o.stack(cfn,plan,receipt,'initializer',m.stacks()['initializer'])
    sid=receipt['initializer']['stack_id']
    if init['StackStatus']!='DELETE_COMPLETE':
     cfn.delete_stack(StackName=sid);cfn.get_waiter('stack_delete_complete').wait(StackName=sid)
    receipt['initializer_removed']=True;o.save(state_path,receipt)
   print('INITIALIZER_PHASE_COMPLETE; verify key-write permission denied before C');return 0
  receipt_path=Path(a.plan).with_suffix('.teardown-receipt.json')
  iam_receipt=json.loads(receipt_path.read_text()) if receipt_path.exists() else []
  if receipt.get('cleanup_captured'):check(digest(iam_receipt)==receipt['cleanup_receipt_sha256'])
  if a.mode=='teardown':
   check(plan.get('failure_cleanup') is True or plan.get('retained'))
   if not plan.get('failure_cleanup'):o.retained(boto3,plan,verified_vault)
   # Clean the exact recorded initializer even after failed provisioning. No arbitrary name deletion.
   if 'initializer' in receipt and not receipt.get('initializer_removed'):
    init,_=o.stack(cfn,plan,receipt,'initializer',m.stacks()['initializer'])
    sid=receipt['initializer']['stack_id']
    if init['StackStatus']!='DELETE_COMPLETE':
     cfn.delete_stack(StackName=sid);cfn.get_waiter('stack_delete_complete').wait(StackName=sid)
    receipt['initializer_removed']=True;o.save(state_path,receipt)
   if not receipt.get('runner_deleted'):
    # Reconcile a crash immediately after create_stack with the persisted request token.
    if 'stack_id' not in receipt.get('runner',{}):
     item=receipt['runner'];existing=cfn.describe_stacks(StackName=plan['runner_stack'])['Stacks'][0]
     events=cfn.describe_stack_events(StackName=existing['StackId'])['StackEvents']
     check(any(e.get('ClientRequestToken')==item['token'] for e in events));item['stack_id']=existing['StackId'];o.save(state_path,receipt)
    stack,resources=o.stack(cfn,plan,receipt,'runner',m.stacks()['runner'])
    iam_receipt.extend(r for r in resources.values() if r['ResourceType'] in ['AWS::IAM::Role','AWS::IAM::InstanceProfile','AWS::Scheduler::Schedule','AWS::Scheduler::ScheduleGroup','AWS::SSM::Document','AWS::SecretsManager::Secret'])
    ec2_before=boto3.client('ec2',region_name=REGION)
    for r in resources.values():
     if r['ResourceType']=='AWS::EC2::Instance' and r.get('ResourceStatus')!='DELETE_COMPLETE':
      for reservation in ec2_before.describe_instances(InstanceIds=[r['PhysicalResourceId']])['Reservations']:
       for instance in reservation['Instances']:
        iam_receipt.extend({'ResourceType':'Recovery::Volume','PhysicalResourceId':x['Ebs']['VolumeId']} for x in instance.get('BlockDeviceMappings',[]))
        iam_receipt.extend({'ResourceType':'Recovery::NetworkInterface','PhysicalResourceId':x['NetworkInterfaceId']} for x in instance.get('NetworkInterfaces',[]))
    o.save(receipt_path,iam_receipt);receipt['cleanup_captured']=True;receipt['cleanup_receipt_sha256']=digest(iam_receipt);o.save(state_path,receipt)
    if stack['StackStatus']!='DELETE_COMPLETE':
     cfn.delete_stack(StackName=stack['StackId']);cfn.get_waiter('stack_delete_complete').wait(StackName=stack['StackId'])
    receipt['runner_deleted']=True;o.save(state_path,receipt)
  # Verify retained vault and report orphan inventory; any found resource is a failure.
  verified_vault=o.vault(boto3,cfn,plan,receipt,m.stacks()['vault'])
  if not plan.get('failure_cleanup'):o.retained(boto3,plan,verified_vault)
  ec2=boto3.client('ec2',region_name=REGION)
  filters=[{'Name':'tag:aws:cloudformation:stack-id','Values':[receipt['runner']['stack_id']]}]
  orphan=[]
  for api,key in [('describe_volumes','Volumes'),('describe_network_interfaces','NetworkInterfaces'),('describe_vpcs','Vpcs'),('describe_subnets','Subnets'),('describe_security_groups','SecurityGroups'),('describe_route_tables','RouteTables'),('describe_internet_gateways','InternetGateways')]:
   for page in ec2.get_paginator(api).paginate(Filters=filters):orphan.extend(page.get(key,[]))
  for page in ec2.get_paginator('describe_instances').paginate(Filters=filters):
   orphan.extend(i for r in page['Reservations'] for i in r['Instances'] if i['State']['Name']!='terminated')
  check(not orphan)
  check(receipt.get('cleanup_captured') is True)
  for r in iam_receipt:
   if r['ResourceType'] in ['Recovery::Volume','Recovery::NetworkInterface']:
    api,key=('describe_volumes','VolumeIds') if r['ResourceType']=='Recovery::Volume' else ('describe_network_interfaces','NetworkInterfaceIds')
    try:getattr(ec2,api)(**{key:[r['PhysicalResourceId']]})
    except Exception as error:check(getattr(error,'response',{}).get('Error',{}).get('Code') in ['InvalidVolume.NotFound','InvalidNetworkInterfaceID.NotFound'])
    else:check(False)
    continue
   if r['ResourceType']=='AWS::SecretsManager::Secret':
    try:boto3.client('secretsmanager',region_name=REGION).describe_secret(SecretId=r['PhysicalResourceId'])
    except Exception as error:check(getattr(error,'response',{}).get('Error',{}).get('Code')=='ResourceNotFoundException')
    else:check(False)
    continue
   if r['ResourceType']=='AWS::Scheduler::ScheduleGroup':
    try:boto3.client('scheduler',region_name=REGION).get_schedule_group(Name=r['PhysicalResourceId'].split('/')[-1])
    except Exception as error:check(getattr(error,'response',{}).get('Error',{}).get('Code')=='ResourceNotFoundException')
    else:check(False)
    continue
   service,api,key=('iam','get_role','RoleName') if r['ResourceType']=='AWS::IAM::Role' else ('iam','get_instance_profile','InstanceProfileName') if r['ResourceType']=='AWS::IAM::InstanceProfile' else ('scheduler','get_schedule','Name') if r['ResourceType']=='AWS::Scheduler::Schedule' else ('ssm','describe_document','Name')
   try:
    kwargs={key:r['PhysicalResourceId']}
    if service=='scheduler':
     parts=r['PhysicalResourceId'].split('/');kwargs={'Name':parts[-1],'GroupName':parts[-2] if len(parts)>1 else plan['runner_stack']+'-expiry'}
    getattr(boto3.client(service,region_name=REGION),api)(**kwargs)
   except Exception as error:
    check(getattr(error,'response',{}).get('Error',{}).get('Code') in ['NoSuchEntity','ResourceNotFoundException','InvalidDocument'])
   else:check(False)
  print(json.dumps({'temporary_ec2_network_storage_absent':True,'vault_stack_present':True,'credential_revocation':'requires separate verified owner action'}));return 0
 except Exception:print('STOP: provisioning/cleanup not verified; inspect ownership locally, no private diagnostics emitted.',file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
