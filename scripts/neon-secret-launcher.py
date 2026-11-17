"""Resolve approved references into a child environment; never secret argv/stdout."""
import argparse,importlib.util,os,subprocess,sys
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
 p=argparse.ArgumentParser();p.add_argument('--configuration-ref',required=True);p.add_argument('--identity-ref',required=True);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args()
 try:sys.exit(launch(a.command[1:] if a.command[:1]==['--'] else a.command,{'RECOVERY_CONFIGURATION':a.configuration_ref,'RECOVERY_IDENTITY':a.identity_ref}))
 except Exception:print('STOP: runtime secret resolution failed; no private diagnostics.',file=sys.stderr);sys.exit(1)
