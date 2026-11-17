"""Synthetic AWS metadata only: no credentials, database contents or paid resources."""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import MagicMock,patch

def module(name,file):
 s=importlib.util.spec_from_file_location(name,'scripts/'+file+'.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
c=module('c','neon-ec2-control');o=c.o;b=module('b','neon-ec2-bindings')
class Missing(Exception):
 response={'Error':{'Code':'ValidationError','Message':'Stack does not exist'}}
class Tests(unittest.TestCase):
 def setUp(self):
  self.plan=dict(account=o.ACCOUNT,region=o.REGION,run_id='a'*32,vault_stack='adam-neon-vault-synthetic',runner_stack='adam-neon-recovery-synthetic')
  self.sid=f"arn:aws:cloudformation:{o.REGION}:{o.ACCOUNT}:stack/{self.plan['vault_stack']}/synthetic-id"
  self.arn=f'arn:aws:secretsmanager:{o.REGION}:{o.ACCOUNT}:secret:synthetic-abcdef'
  self.version='12345678-1234-1234-1234-123456789abc'
  self.out={'Bucket':'synthetic-new-bucket','KeySecretArn':self.arn}
  self.template=c.m.stacks()['vault']
  self.receipt={'vault':{'stack_id':self.sid,'template_sha256':o.digest(self.template),'token':'a'*32+'-vault'}}
  self.actual={'StackId':self.sid,'StackName':self.plan['vault_stack'],'StackStatus':'CREATE_COMPLETE','Tags':o.tags(self.plan,'vault'),'Outputs':[{'OutputKey':k,'OutputValue':v} for k,v in self.out.items()]}
  self.resources=[{'LogicalResourceId':k,'PhysicalResourceId':v,'ResourceType':t} for k,v,t in [('Archive',self.out['Bucket'],'AWS::S3::Bucket'),('RecoveryIdentity',self.arn,'AWS::SecretsManager::Secret')]]
  self.cfn=MagicMock();self.cfn.describe_stacks.return_value={'Stacks':[self.actual]};self.cfn.get_template.return_value={'TemplateBody':self.template};self.cfn.get_paginator.return_value.paginate.return_value=[{'StackResourceSummaries':self.resources}]
  self.aws=MagicMock();self.client=self.aws.client.return_value
  self.client.get_bucket_versioning.return_value={'Status':'Enabled'}
  self.client.get_public_access_block.return_value={'PublicAccessBlockConfiguration':{k:True for k in ['BlockPublicAcls','IgnorePublicAcls','BlockPublicPolicy','RestrictPublicBuckets']}}
  self.client.get_bucket_encryption.return_value={'ServerSideEncryptionConfiguration':{'Rules':[{'ApplyServerSideEncryptionByDefault':{'SSEAlgorithm':'AES256'}}]}}
  self.client.get_bucket_policy.return_value={'Policy':json.dumps({'Statement':[{'Effect':'Deny','Principal':'*','Action':'s3:*','Condition':{'Bool':{'aws:SecureTransport':'false'}},'Resource':['arn:aws:s3:::synthetic-new-bucket/*']}]})}
  self.client.describe_secret.return_value={'ARN':self.arn,'VersionIdsToStages':{self.version:[b.stage(self.version)]}}
 def vault(self):return o.vault(self.aws,self.cfn,self.plan,self.receipt,self.template)
 def proof(self):
  proof=dict(bucket=self.out['Bucket'],key_secret_arn=self.arn,object_key='recovery/synthetic.age',archive_version='exact-version',key_version=self.version,ciphertext_bytes=100,recovery_fingerprint='f'*64,independent_key_recovery_verified=True,application_acceptance_verified=True)
  self.client.head_object.return_value={'VersionId':'exact-version','ContentLength':100,'ServerSideEncryption':'AES256','Metadata':{'recovery-fingerprint':'f'*64}}
  return {**self.plan,'retained':proof}
 def test_verified_new_vault(self):
  self.assertEqual(self.vault(),self.out)
  self.client.head_bucket.assert_called_once_with(Bucket=self.out['Bucket'],ExpectedBucketOwner=o.ACCOUNT)
 def test_same_name_unrelated_stack_rejected(self):
  self.actual['StackId']=self.sid+'other'
  with self.assertRaises(ValueError):self.vault()
 def test_other_run_tags_rejected(self):
  self.actual['Tags']=o.tags({**self.plan,'run_id':'b'*32},'vault')
  with self.assertRaises(ValueError):self.vault()
 def test_unrelated_bucket_output_rejected(self):
  self.actual['Outputs'][0]['OutputValue']='existing-application-media'
  with self.assertRaises(ValueError):self.vault()
 def test_unrelated_secret_output_rejected(self):
  self.actual['Outputs'][1]['OutputValue']=self.arn+'unrelated'
  with self.assertRaises(ValueError):self.vault()
 def test_template_drift_rejected(self):
  self.cfn.get_template.return_value={'TemplateBody':{}}
  with self.assertRaises(ValueError):self.vault()
 def test_bucket_security_drift_rejected(self):
  self.client.get_bucket_versioning.return_value={'Status':'Suspended'}
  with self.assertRaises(ValueError):self.vault()
 def test_stage_fingerprints_do_not_reuse_approval(self):
  initial=c.approval(self.plan,{},'provision-vault')
  self.assertNotEqual(initial,c.approval(self.plan,self.receipt,'provision'))
  self.assertNotEqual(initial,c.approval(self.plan,{},'provision'))
  self.assertNotEqual(initial,c.approval({**self.plan,'parameters':{'ArchiveBucket':'other'}},{},'provision-vault'))
 def test_exact_archive_and_key_metadata(self):
  self.assertTrue(o.retained(self.aws,self.proof(),self.out)['key_version_verified'])
  self.client.head_object.assert_called_once_with(Bucket=self.out['Bucket'],Key='recovery/synthetic.age',VersionId='exact-version',ExpectedBucketOwner=o.ACCOUNT)
 def test_wrong_archive_version_rejected(self):
  plan=self.proof();self.client.head_object.return_value['VersionId']='newer-unapproved'
  with self.assertRaises(ValueError):o.retained(self.aws,plan,self.out)
 def test_missing_key_version_rejected(self):
  plan=self.proof();self.client.describe_secret.return_value['VersionIdsToStages']={}
  with self.assertRaises(ValueError):o.retained(self.aws,plan,self.out)
 def test_archive_fingerprint_mismatch_rejected(self):
  plan=self.proof();self.client.head_object.return_value['Metadata']={}
  with self.assertRaises(ValueError):o.retained(self.aws,plan,self.out)
 def test_exact_reference_with_unique_version_stage(self):
  plan={'configuration_secret_arn':self.arn,'configuration_version':self.version,'key_secret_arn':self.arn,'key_version':self.version}
  refs=b.references(plan,self.client);self.assertIn(':SecretString::RECOVERY_',refs['RECOVERY_IDENTITY']);self.assertNotIn('AWSCURRENT',str(refs))
 def test_moved_identity_label_rejected(self):
  plan={'configuration_secret_arn':self.arn,'configuration_version':self.version,'key_secret_arn':self.arn,'key_version':self.version}
  self.client.describe_secret.return_value['VersionIdsToStages']={'other':[b.stage(self.version)]}
  with self.assertRaises(ValueError):b.references(plan,self.client)
 def test_different_secret_arn_rejected(self):
  plan={'configuration_secret_arn':self.arn+'other','configuration_version':self.version,'key_secret_arn':self.arn,'key_version':self.version}
  with self.assertRaises(ValueError):b.references(plan,self.client)
 def test_existing_stack_not_adopted_without_creation_token(self):
  receipt={};self.cfn.describe_stack_events.return_value={'StackEvents':[{'ClientRequestToken':'unrelated'}]}
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(RuntimeError):c.create(self.cfn,self.plan,receipt,Path(d)/'receipt.json','vault')
  self.cfn.create_stack.assert_not_called()
 def test_interrupted_create_reconciles_exact_request_token(self):
  receipt={};self.cfn.describe_stack_events.return_value={'StackEvents':[{'ClientRequestToken':'a'*32+'-vault','ResourceType':'AWS::CloudFormation::Stack'}]}
  with tempfile.TemporaryDirectory() as d:c.create(self.cfn,self.plan,receipt,Path(d)/'receipt.json','vault')
  self.assertEqual(receipt['vault']['stack_id'],self.sid);self.cfn.create_stack.assert_not_called()
 def test_interrupted_atomic_writer_does_not_block_retry(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'receipt.json';path.with_suffix('.pending').write_text('interrupted synthetic write')
   o.save(path,{'version':1});o.save(path,{'version':2})
   self.assertEqual(json.loads(path.read_text()),{'version':2});self.assertEqual(path.stat().st_mode&0o777,0o600)
 def test_create_failure_keeps_cleanup_receipt(self):
  self.cfn.describe_stacks.side_effect=[Missing(),{'Stacks':[self.actual]}]
  self.cfn.create_stack.return_value={'StackId':self.sid};self.cfn.get_waiter.return_value.wait.side_effect=RuntimeError('synthetic failure')
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'receipt.json'
   with self.assertRaises(RuntimeError):c.create(self.cfn,self.plan,{},path,'vault')
   saved=json.loads(path.read_text());self.assertEqual(saved['vault']['stack_id'],self.sid);self.assertEqual(path.stat().st_mode&0o777,0o600)
class RuntimeBindings(unittest.TestCase):
 setUp=Tests.setUp
 def runtime(self):
  role='synthetic-new-role';db=self.arn+'db'
  out={'RunnerRoleName':role,'DatabaseSecretArn':db}
  params={'ReviewedAmi':'ami-reviewed','SourceCidr':'192.0.2.1/32','TargetCidr':'192.0.2.2/32','ArchiveBucket':self.out['Bucket'],'KeySecretArn':self.arn,'VaultStackId':self.sid}
  plan={**self.plan,'parameters':params}
  receipt={**self.receipt,'run_id':plan['run_id'],'runner_outputs':out,'initializer_removed':True,'initializer':{'stack_id':'exact-initializer'}}
  runtime=dict(provisioning_plan=plan,ownership_receipt=receipt,ownership_fingerprint=o.digest(receipt),bucket=self.out['Bucket'],key_secret_arn=self.arn,configuration_secret_arn=db,ami=params['ReviewedAmi'],source_cidr=params['SourceCidr'],target_cidr=params['TargetCidr'])
  runner={'StackStatus':'CREATE_COMPLETE','Outputs':[{'OutputKey':k,'OutputValue':v} for k,v in out.items()],'Parameters':[{'ParameterKey':k,'ParameterValue':v} for k,v in params.items()]}
  resources={'Role':{'PhysicalResourceId':role},'DatabaseSecretArn':{'PhysicalResourceId':db}}
  return runtime,runner,resources
 def verify_runtime(self,runtime,runner,resources):
  self.cfn.describe_stacks.return_value={'Stacks':[{'StackId':'exact-initializer','StackStatus':'DELETE_COMPLETE'}]}
  self.aws.client.return_value=self.cfn
  with patch.object(b.o,'vault',return_value=self.out),patch.object(b.o,'stack',return_value=(runner,resources)):return b.verify(self.aws,runtime)
 def test_runtime_matches_verified_outputs(self):self.assertIn('RunnerRoleName',self.verify_runtime(*self.runtime()))
 def test_runtime_unrelated_role_rejected(self):
  runtime,runner,resources=self.runtime();resources['Role']['PhysicalResourceId']='unrelated-existing-role'
  with self.assertRaises(ValueError):self.verify_runtime(runtime,runner,resources)
 def test_runtime_unrelated_secrets_rejected(self):
  for key in ['key_secret_arn','configuration_secret_arn']:
   runtime,runner,resources=self.runtime();runtime[key]='unrelated-existing-secret'
   with self.assertRaises(ValueError):self.verify_runtime(runtime,runner,resources)
 def test_runtime_provisioning_parameter_drift_rejected(self):
  runtime,runner,resources=self.runtime();runner['Parameters'][0]['ParameterValue']='unapproved-ami'
  with self.assertRaises(ValueError):self.verify_runtime(runtime,runner,resources)
 def test_runtime_requires_verified_initializer_removal(self):
  runtime,runner,resources=self.runtime();runtime['ownership_receipt']['initializer_removed']=False;runtime['ownership_fingerprint']=o.digest(runtime['ownership_receipt'])
  with self.assertRaises(ValueError):self.verify_runtime(runtime,runner,resources)

class ParameterBindings(unittest.TestCase):
 def test_runner_only_accepts_unallocated_inputs(self):
  p=module('plans','neon-ec2-plan')
  args=dict(ReviewedAmi='ami-synthetic',SourceCidr='192.0.2.1/32',TargetCidr='192.0.2.2/32',Expiry='2026-11-17T20:00:00')
  receipt={'vault':{'stack_id':'new-stack'}};out={'Bucket':'new-bucket','KeySecretArn':'new-key'}
  actual=p.runner_parameters(args,out,receipt);self.assertEqual(actual['ArchiveBucket'],'new-bucket');self.assertEqual(actual['VaultStackId'],'new-stack')
  for key in ['ArchiveBucket','KeySecretArn','VaultStackId','RunnerRoleName']:
   with self.assertRaises(ValueError):p.runner_parameters({**args,key:'unrelated'},out,receipt)
 def test_runtime_cannot_override_vault_or_role(self):
  p=module('plans','neon-ec2-plan')
  for key in ['bucket','key_secret_arn','configuration_secret_arn','ownership_receipt','ami']:
   with self.assertRaises(ValueError):p.runtime_plan({}, {},{'target_branch':'br-isolated','target_endpoint':'ep-isolated.neon.tech','target_database':'isolated',key:'unrelated'})

class Cleanup(unittest.TestCase):
 setUp=Tests.setUp
 proof=Tests.proof
 # Execute the real controller + retained-version checks with synthetic AWS APIs.
 def execute_cleanup(self,wrong_version=False,orphan=False,failure=False,interrupt=False):
  import sys
  plan=self.proof()
  if failure:plan.pop('retained');plan['failure_cleanup']=True
  if wrong_version:self.client.head_object.return_value['VersionId']='unapproved'
  sid=self.sid.replace(self.plan['vault_stack'],self.plan['runner_stack'])
  receipt={**self.receipt,'run_id':plan['run_id'],'intent':c.digest({k:plan[k] for k in ['account','region','run_id','vault_stack','runner_stack']}),'vault_outputs':self.out,'runner':{'stack_id':sid,'template_sha256':c.digest(c.m.stacks()['runner'])}}
  runner={'StackId':sid,'StackStatus':'ROLLBACK_COMPLETE'}
  resources={'Role':{'LogicalResourceId':'Role','ResourceType':'AWS::IAM::Role','PhysicalResourceId':'synthetic-role'}}
  ec2=MagicMock();ec2.get_paginator.return_value.paginate.return_value=[{'Volumes':[{}],'Reservations':[]}] if orphan else [{'Reservations':[]}]
  iam=MagicMock();missing=Exception();missing.response={'Error':{'Code':'NoSuchEntity'}};iam.get_role.side_effect=missing
  sts=MagicMock();sts.get_caller_identity.return_value={'Account':o.ACCOUNT}
  def client(service,**kwargs):return {'cloudformation':self.cfn,'ec2':ec2,'iam':iam,'sts':sts}.get(service,self.client)
  self.aws.client.side_effect=client
  if interrupt:self.cfn.get_waiter.return_value.wait.side_effect=[RuntimeError('interrupted'),None]
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/'plan.json';path.write_text(json.dumps(plan));state=path.with_suffix('.ownership.json');o.save(state,receipt)
   def run(mode):
    saved=json.loads(state.read_text());argv=['control',mode,'--plan',str(path),'--approval',c.approval(plan,saved,mode)]
    with patch.object(sys,'argv',argv),patch.dict(sys.modules,{'boto3':self.aws}),patch.object(c.o,'vault',return_value=self.out),patch.object(c.o,'stack',return_value=(runner,resources)):return c.main()
   result=run('teardown')
   if interrupt:
    self.assertEqual(result,1);self.assertTrue(path.with_suffix('.teardown-receipt.json').exists());result=run('teardown')
   if result==0:self.assertEqual(run('verify'),0)
  return result,sid
 def test_teardown_checks_exact_archive_and_key_before_and_after_deletion(self):
  result,sid=self.execute_cleanup();self.assertEqual(result,0)
  self.cfn.delete_stack.assert_called_once_with(StackName=sid)
  self.assertGreaterEqual(self.client.head_object.call_count,3)
 def test_bad_retained_version_blocks_deletion(self):
  result,_=self.execute_cleanup(wrong_version=True);self.assertEqual(result,1);self.cfn.delete_stack.assert_not_called()
 def test_orphan_blocks_completion(self):self.assertEqual(self.execute_cleanup(orphan=True)[0],1)
 def test_failed_create_cleanup_retains_vault_without_claiming_recovery(self):
  result,sid=self.execute_cleanup(failure=True);self.assertEqual(result,0);self.cfn.delete_stack.assert_called_once_with(StackName=sid);self.client.head_object.assert_not_called()
 def test_interrupted_delete_can_resume_from_exact_resource_receipt(self):self.assertEqual(self.execute_cleanup(interrupt=True)[0],0)

if __name__=='__main__':unittest.main()
