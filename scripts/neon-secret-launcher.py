"""Resolve approved references into a child environment; never secret argv/stdout."""
import argparse,importlib.util,os,subprocess,sys,json,tempfile,shutil,resource
from pathlib import Path
s=importlib.util.spec_from_file_location('official',Path(__file__).with_name('vendor')/'aws-asm-exec.py');official=importlib.util.module_from_spec(s);s.loader.exec_module(official)
def launch(command,references,resolver=official.resolve_string,execute=subprocess.run):
 if set(references)!={'RECOVERY_CONFIGURATION','RECOVERY_IDENTITY'}:raise ValueError('Invalid environment names')
 if not all(v.startswith('{{resolve:secretsmanager:') and v.endswith('}}') for v in references.values()):raise ValueError('References only')
 env=dict(os.environ)
 for k,v in references.items():env[k]=resolver(v)
 # Child failures must be sanitized by the recovery entry point.
 result=execute(command,env=env,check=False)
 for k in references:env.pop(k,None)
 return result.returncode
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--runtime-plan',required=True);p.add_argument('--configuration-ref',required=True);p.add_argument('--identity-ref',required=True);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args()
 try:
  resource.setrlimit(resource.RLIMIT_CORE,(0,0))
  command=a.command[1:] if a.command[:1]==['--'] else a.command
  if len(command)<2 or Path(command[1]).name not in ['neon-ec2-run.py','neon-restored-app-acceptance.mjs']:raise ValueError('Unapproved child')
  spec=importlib.util.spec_from_file_location('ec2',Path(__file__).with_name('neon-ec2-adapter.py'));ec2=importlib.util.module_from_spec(spec);spec.loader.exec_module(ec2)
  plan=json.loads(ec2.core.private_file(a.runtime_plan).read_text());ec2.protocol.fingerprint(plan)
  import boto3
  root=Path(tempfile.mkdtemp(prefix='neon-launch-attest-',dir='/run'))
  try:ec2.Adapter(boto3,plan,{},root).attest(plan)
  finally:shutil.rmtree(root)
  sys.exit(launch(command,{'RECOVERY_CONFIGURATION':a.configuration_ref,'RECOVERY_IDENTITY':a.identity_ref}))
 except Exception:print('STOP: runtime secret resolution failed; no private diagnostics.',file=sys.stderr);sys.exit(1)
