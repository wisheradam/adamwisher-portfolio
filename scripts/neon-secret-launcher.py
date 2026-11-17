"""Resolve approved references into a child environment; never secret argv/stdout."""
import argparse,importlib.util,os,subprocess,sys,json,tempfile,shutil,resource
from pathlib import Path
s=importlib.util.spec_from_file_location('official',Path(__file__).with_name('vendor')/'aws-asm-exec.py');official=importlib.util.module_from_spec(s);s.loader.exec_module(official)
def launch(command,references,resolver=official.resolve_string,execute=subprocess.run,approved_references=None):
 if approved_references is None or references!=approved_references:raise ValueError("Unapproved secret reference")
 if set(references)!={'RECOVERY_CONFIGURATION','RECOVERY_IDENTITY'}:raise ValueError('Invalid environment names')
 if not all(v.startswith('{{resolve:secretsmanager:') and v.endswith('}}') for v in references.values()):raise ValueError('References only')
 env=dict(os.environ)
 try:
  for k,v in references.items():env[k]=resolver(v)
  result=execute(command,env=env,check=False)
  return result.returncode
 finally:
  for k in references:env.pop(k,None)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--runtime-plan',required=True);p.add_argument('--approval',default='');p.add_argument('--configuration-ref',required=True);p.add_argument('--identity-ref',required=True);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args()
 try:
  resource.setrlimit(resource.RLIMIT_CORE,(0,0))
  command=a.command[1:] if a.command[:1]==['--'] else a.command
  if len(command)<2 or Path(command[1]).name not in ['neon-ec2-run.py','neon-restored-app-acceptance.mjs']:raise ValueError('Unapproved child')
  if Path(command[1]).resolve()!=Path(__file__).with_name(Path(command[1]).name).resolve():raise ValueError('Unapproved child path')
  expected_interpreter=Path(sys.executable) if command[1].endswith('.py') else Path('/opt/neon-node20/bin/node')
  if Path(command[0]).resolve()!=expected_interpreter.resolve():raise ValueError('Unapproved interpreter')
  if any(os.environ.get(k) for k in ['ASM_EXEC_MCP_ENDPOINT','AWS_SECRETS_MANAGER_AGENT_ENDPOINT','NODE_OPTIONS','NODE_PATH','PYTHONPATH','PYTHONHOME']):raise ValueError('Runtime override')
  spec=importlib.util.spec_from_file_location('ec2',Path(__file__).with_name('neon-ec2-adapter.py'));ec2=importlib.util.module_from_spec(spec);spec.loader.exec_module(ec2)
  plan=json.loads(ec2.core.private_file(a.runtime_plan).read_text());ec2.protocol.fingerprint(plan)
  import boto3
  spec=importlib.util.spec_from_file_location('bindings',Path(__file__).with_name('neon-ec2-bindings.py'));bindings=importlib.util.module_from_spec(spec);spec.loader.exec_module(bindings)
  bindings.verify(boto3,plan)
  approved_refs=bindings.references(plan,boto3.client('secretsmanager',region_name=plan['region']))
  supplied={'RECOVERY_CONFIGURATION':a.configuration_ref,'RECOVERY_IDENTITY':a.identity_ref}
  if supplied!=approved_refs:raise ValueError('Reference mismatch')
  if Path(command[1]).name=='neon-ec2-run.py':
   if command[2:3]==['recover'] and a.approval!=ec2.protocol.fingerprint(plan):raise ValueError('Recovery approval mismatch')
   if command[2:] not in [['preflight','--plan',a.runtime_plan],['recover','--plan',a.runtime_plan,'--approval',a.approval]]:raise ValueError('Unbound recovery command')
  else:
   if command[2:]!=['--plan',a.runtime_plan,'--approval',a.approval]:raise ValueError('Unbound application command')
   if a.approval!=ec2.protocol.fingerprint(plan):raise ValueError('Application approval mismatch')
   receipt=json.loads(ec2.core.private_file(str(Path(a.runtime_plan).with_suffix('.recovery.json'))).read_text())
   if receipt['fingerprint']!=a.approval or receipt['target_endpoint']!=plan['target_endpoint'] or receipt['target_branch']!=plan['target_branch'] or receipt['status']!='MATCH':raise ValueError('Recovery receipt mismatch')
   os.environ['RECOVERY_APPROVED_PLAN']=json.dumps(plan,sort_keys=True)
  root=Path(tempfile.mkdtemp(prefix='neon-launch-attest-',dir='/run'))
  try:ec2.Adapter(boto3,plan,{},root).attest(plan)
  finally:shutil.rmtree(root)
  spec=importlib.util.spec_from_file_location('pinned',Path(__file__).with_name('neon-versioned-resolver.py'));pinned=importlib.util.module_from_spec(spec);spec.loader.exec_module(pinned)
  def pinned_resolve(reference):
   side='configuration' if reference==approved_refs['RECOVERY_CONFIGURATION'] else 'key'
   return pinned.resolve(official,reference,plan[side+'_secret_arn'],plan[side+'_version'],bindings.stage(plan[side+'_version']),plan['region'])
  def pinned_execute(command,**kwargs):
   if bindings.references(plan,boto3.client('secretsmanager',region_name=plan['region']))!=approved_refs:raise ValueError('Secret pin drift')
   return subprocess.run(command,**kwargs)
  sys.exit(launch(command,supplied,approved_references=approved_refs,execute=pinned_execute,resolver=pinned_resolve))
 except Exception:print('STOP: runtime secret resolution failed; no private diagnostics.',file=sys.stderr);sys.exit(1)
