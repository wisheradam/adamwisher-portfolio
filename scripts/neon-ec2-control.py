#!/usr/bin/env python3
"""Owner-side gated stack control. No credential/data values are logged."""
import argparse,datetime,hashlib,importlib.util,json,sys
from pathlib import Path
s=importlib.util.spec_from_file_location('stacks',Path(__file__).parents[1]/'infra/recovery/stacks.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
ACCOUNT='533267008693';REGION='eu-central-1'
def check(ok):
 if not ok:raise RuntimeError('Control gate failed')
def digest(plan):return hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['plan','provision','teardown','verify']);p.add_argument('--plan',required=True);p.add_argument('--approval');a=p.parse_args()
 try:
  plan=json.loads(Path(a.plan).read_text());check(plan['account']==ACCOUNT and plan['region']==REGION)
  check(plan['runner_stack'].startswith('adam-neon-recovery-') and plan['vault_stack'].startswith('adam-neon-vault-'))
  check(plan['runner_stack']!=plan['vault_stack'])
  if a.mode=='plan':print(json.dumps({'fingerprint':digest(plan),'resources':'dedicated runner stack and independent retained vault'}));return 0
  check(a.approval==digest(plan))
  import boto3
  check(boto3.client('sts').get_caller_identity()['Account']==ACCOUNT)
  cfn=boto3.client('cloudformation',region_name=REGION)
  if a.mode=='provision':
   expiry=datetime.datetime.fromisoformat(plan['parameters']['Expiry']).replace(tzinfo=datetime.timezone.utc)
   check(0<(expiry-datetime.datetime.now(datetime.timezone.utc)).total_seconds()<=8*3600)
   # Vault must already be approved/deployed with its retained key provisioned independently.
   vault=cfn.describe_stacks(StackName=plan['vault_stack'])['Stacks'][0]
   check(vault['StackStatus'] in ['CREATE_COMPLETE','UPDATE_COMPLETE'])
   cfn.create_stack(StackName=plan['runner_stack'],TemplateBody=json.dumps(m.stacks()['runner']),Parameters=[{'ParameterKey':k,'ParameterValue':v} for k,v in plan['parameters'].items()],Capabilities=['CAPABILITY_IAM'],Tags=[{'Key':'Purpose','Value':'adamwisher-neon-recovery'}])
   cfn.get_waiter('stack_create_complete').wait(StackName=plan['runner_stack'])
   print(json.dumps({'provisioned':True,'recovery_execution_approved':False}));return 0
  iam_receipt=[]
  if a.mode=='teardown':
   check(plan.get('archive_and_key_recovery_proof') is True)
   # Inspect ownership before deletion; never delete by a broad resource prefix.
   stack=cfn.describe_stacks(StackName=plan['runner_stack'])['Stacks'][0]
   check({'Key':'Purpose','Value':'adamwisher-neon-recovery'} in stack.get('Tags',[]))
   for page in cfn.get_paginator('list_stack_resources').paginate(StackName=stack['StackId']):
    iam_receipt.extend(r for r in page['StackResourceSummaries'] if r['ResourceType'] in ['AWS::IAM::Role','AWS::IAM::InstanceProfile','AWS::Scheduler::Schedule','AWS::SSM::Document'])
   cfn.delete_stack(StackName=stack['StackId']);cfn.get_waiter('stack_delete_complete').wait(StackName=stack['StackId'])
  # Verify retained vault and report orphan inventory; any found resource is a failure.
  cfn.describe_stacks(StackName=plan['vault_stack'])
  ec2=boto3.client('ec2',region_name=REGION)
  filters=[{'Name':'tag:aws:cloudformation:stack-name','Values':[plan['runner_stack']]}]
  orphan=[]
  for api,key in [('describe_volumes','Volumes'),('describe_network_interfaces','NetworkInterfaces'),('describe_vpcs','Vpcs'),('describe_subnets','Subnets'),('describe_security_groups','SecurityGroups'),('describe_route_tables','RouteTables'),('describe_internet_gateways','InternetGateways')]:
   for page in ec2.get_paginator(api).paginate(Filters=filters):orphan.extend(page.get(key,[]))
  for page in ec2.get_paginator('describe_instances').paginate(Filters=filters):
   orphan.extend(i for r in page['Reservations'] for i in r['Instances'] if i['State']['Name']!='terminated')
  check(not orphan)
  for r in iam_receipt:
   service,api,key=('iam','get_role','RoleName') if r['ResourceType']=='AWS::IAM::Role' else ('iam','get_instance_profile','InstanceProfileName') if r['ResourceType']=='AWS::IAM::InstanceProfile' else ('scheduler','get_schedule','Name') if r['ResourceType']=='AWS::Scheduler::Schedule' else ('ssm','describe_document','Name')
   try:
    getattr(boto3.client(service,region_name=REGION),api)(**{key:r['PhysicalResourceId']})
   except Exception as error:
    check(getattr(error,'response',{}).get('Error',{}).get('Code') in ['NoSuchEntity','ResourceNotFoundException','InvalidDocument'])
   else:check(False)
  print(json.dumps({'temporary_ec2_network_storage_absent':True,'vault_stack_present':True,'credential_revocation':'requires separate verified owner action'}));return 0
 except Exception:print('STOP: provisioning/cleanup not verified; inspect ownership locally, no private diagnostics emitted.',file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
