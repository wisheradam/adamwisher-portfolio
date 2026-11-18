"""Offline schema/security validation and negative controls; never calls AWS."""
import importlib.util,json,os,subprocess,tempfile
from pathlib import Path
s=importlib.util.spec_from_file_location('s','infra/recovery/stacks.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
lint=os.environ['CFNLINT'];guard=os.environ['CFNGUARD'];rules='infra/recovery/security.guard'
with tempfile.TemporaryDirectory() as d:
 paths=[]
 for name,template in m.stacks().items():
  p=Path(d)/(name+'.json');p.write_text(json.dumps(template));paths.append(str(p))
 result=subprocess.run([lint,'--format','json','--regions','eu-central-1','-t',*paths],capture_output=True,text=True)
 if result.returncode:raise RuntimeError('CloudFormation schema validation failed: '+result.stdout)
 for path in paths:
  r=subprocess.run([guard,'validate','--rules',rules,'--data',path,'--output-format','json'],capture_output=True,text=True)
  if r.returncode:raise RuntimeError('Guard validation failed: '+r.stdout)
 for name,mutate in [('runner',lambda t:t['Resources']['Runner']['Properties']['BlockDeviceMappings'][0]['Ebs'].update(Encrypted=False)),('runner',lambda t:t['Resources'].pop('ExpirySchedule')),('vault',lambda t:t['Resources']['Archive']['Properties']['PublicAccessBlockConfiguration'].update(BlockPublicAcls=False))]:
  template=m.stacks()[name];mutate(template);p=Path(d)/'negative.json';p.write_text(json.dumps(template))
  r=subprocess.run([guard,'validate','--rules',rules,'--data',str(p),'--output-format','json'],capture_output=True)
  assert r.returncode!=0,'Broken security control was not rejected'
print('CloudFormation: 3 schema checks, 3 Guard checks and 3 negative controls PASS; no AWS resources created')
