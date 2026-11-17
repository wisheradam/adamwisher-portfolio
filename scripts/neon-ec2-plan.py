"""Prepare non-secret staged plans; never provisions or resolves secret values."""
import argparse,importlib.util,json,sys,uuid
from pathlib import Path
s=importlib.util.spec_from_file_location('bindings',Path(__file__).with_name('neon-ec2-bindings.py'));b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
s=importlib.util.spec_from_file_location('protocol',Path(__file__).with_name('neon-ec2-protocol.py'));protocol=importlib.util.module_from_spec(s);s.loader.exec_module(protocol)
o=b.o

def runner_parameters(inputs,outputs,receipt):
 o.check(set(inputs)=={'ReviewedAmi','SourceCidr','TargetCidr','Expiry'})
 return {**inputs,'ArchiveBucket':outputs['Bucket'],'KeySecretArn':outputs['KeySecretArn'],'VaultStackId':receipt['vault']['stack_id']}
def runtime_plan(plan,receipt,inputs):
 allowed={'target_branch','target_endpoint','target_database','recipient','key_version','configuration_version'}
 o.check(set(inputs)<=allowed and {'target_branch','target_endpoint','target_database'}<=set(inputs))
 parameters=plan['parameters'];out=receipt['vault_outputs'];runner=receipt['runner_outputs']
 value={**inputs,'account':o.ACCOUNT,'region':o.REGION,'ec2_runtime':True,'source_branch':'br-wispy-darkness-b91vydbj','source_endpoint':'ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech','source_database':'neondb','source_service':'source','target_service':'target','ami':parameters['ReviewedAmi'],'source_cidr':parameters['SourceCidr'],'target_cidr':parameters['TargetCidr'],'bucket':out['Bucket'],'key_secret_arn':out['KeySecretArn'],'configuration_secret_arn':runner['DatabaseSecretArn'],'object_key':'recovery/'+plan['run_id']+'.age','provisioning_plan':plan,'ownership_receipt':receipt,'ownership_fingerprint':o.digest(receipt),'application_acceptance':'synthetic fixtures on this restored target only'}
 if 'neon' in plan:
  n=plan['neon']
  for side in ['source','target']:
   for suffix,field in [('branch','branch_id'),('endpoint','endpoint'),('database','database')]:
    o.check(value[side+'_'+suffix]==n[side][field])
   value[side+'_dns_answers']=n[side]['dns_answers']
  value['target_role']=n['target']['role']
 protocol.fingerprint(value);return value

def main():
 p=argparse.ArgumentParser();p.add_argument('mode',choices=['intent','bind-runner','bind-runtime','fingerprint']);p.add_argument('--plan',required=True);p.add_argument('--inputs');p.add_argument('--out');a=p.parse_args()
 try:
  path=Path(a.plan)
  if a.mode=='fingerprint':
   print(json.dumps({'fingerprint':protocol.fingerprint(json.loads(path.read_text()))}));return 0
  if a.mode=='intent':
   o.check(not path.exists());run=uuid.uuid4().hex
   value={'account':o.ACCOUNT,'region':o.REGION,'run_id':run,'vault_stack':'adam-neon-vault-pr14-'+run[:8],'runner_stack':'adam-neon-recovery-pr14-'+run[:8]};o.save(path,value)
  else:
   plan=json.loads(path.read_text());o.validate(plan);receipt=json.loads(path.with_suffix('.ownership.json').read_text());inputs=json.loads(Path(a.inputs).read_text())
   if a.mode=='bind-runner':
    import boto3
    o.check(boto3.client('sts').get_caller_identity()['Account']==o.ACCOUNT)
    outputs=o.vault(boto3,boto3.client('cloudformation',region_name=o.REGION),plan,receipt,b.stacks.stacks()['vault'])
    o.check(outputs==receipt['vault_outputs']);plan['parameters']=runner_parameters(inputs,outputs,receipt);o.save(path,plan)
   else:
    o.check(a.out and not Path(a.out).exists());o.save(Path(a.out),runtime_plan(plan,receipt,inputs))
  print('NON_SECRET_PLAN_PREPARED; obtain approval for its next stage fingerprint');return 0
 except Exception:print('STOP: staged plan not prepared; private diagnostics suppressed.',file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
