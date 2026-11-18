import importlib.util,unittest
s=importlib.util.spec_from_file_location('l','scripts/neon-secret-launcher.py');l=importlib.util.module_from_spec(s);s.loader.exec_module(l)
class Tests(unittest.TestCase):
 def test_no_secret_in_argv(self):
  seen={}
  def execute(args,**kw):seen.update(args=args,env=dict(kw['env']));return type('R',(),{'returncode':0})()
  refs={k:'{{resolve:secretsmanager:synthetic}}' for k in ['RECOVERY_CONFIGURATION','RECOVERY_IDENTITY']}
  self.assertEqual(l.launch(['python3','trusted.py'],refs,resolver=lambda x:'synthetic-private-value',execute=execute,approved_references=refs),0)
  self.assertNotIn('synthetic-private-value',str(seen['args']));self.assertEqual(seen['env']['RECOVERY_IDENTITY'],'synthetic-private-value')
 def test_unapproved_reference_never_resolved(self):
  from unittest.mock import MagicMock
  resolver=MagicMock()
  refs={k:'{{resolve:secretsmanager:unrelated}}' for k in ['RECOVERY_CONFIGURATION','RECOVERY_IDENTITY']}
  with self.assertRaises(ValueError):l.launch([],refs,resolver=resolver,approved_references={k:'{{resolve:secretsmanager:approved}}' for k in refs})
  resolver.assert_not_called()
 def test_alias_cannot_replace_pinned_reference(self):
  from unittest.mock import MagicMock
  resolver=MagicMock()
  approved={k:'{{resolve:secretsmanager:approved:SecretString::RECOVERY_pin}}' for k in ['RECOVERY_CONFIGURATION','RECOVERY_IDENTITY']}
  supplied={**approved,'RECOVERY_IDENTITY':'{{resolve:secretsmanager:approved:SecretString::AWSCURRENT}}'}
  with self.assertRaises(ValueError):l.launch([],supplied,resolver=resolver,approved_references=approved)
  resolver.assert_not_called()
 def test_failed_child_scrubs_resolved_environment(self):
  seen={}
  def execute(args,**kwargs):seen.update(env=kwargs['env']);raise RuntimeError('synthetic')
  refs={k:'{{resolve:secretsmanager:synthetic}}' for k in ['RECOVERY_CONFIGURATION','RECOVERY_IDENTITY']}
  with self.assertRaises(RuntimeError):l.launch([],refs,resolver=lambda r:'synthetic-value',execute=execute,approved_references=refs)
  self.assertFalse(set(refs)&set(seen['env']))
 def test_plaintext_rejected(self):
  with self.assertRaises(ValueError):l.launch([],{'RECOVERY_CONFIGURATION':'plain','RECOVERY_IDENTITY':'plain'})
class AtomicVersionPins(unittest.TestCase):
 def setUp(self):
  spec=importlib.util.spec_from_file_location('pinned','scripts/neon-versioned-resolver.py');self.p=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.p)
  self.arn='arn:aws:secretsmanager:eu-central-1:533267008693:secret:synthetic-abcdef';self.version='12345678-1234-1234-1234-123456789abc';self.label='RECOVERY_'+self.version.replace('-','');self.reference='{{resolve:secretsmanager:'+self.arn+':SecretString::'+self.label+'}}'
 def test_native_version_id_and_stage_sent_atomically(self):
  from unittest.mock import patch
  import shlex
  seen=[]
  def post(payload,session_id=None):
   if payload.get('method')=='tools/call':
    command=shlex.split(payload['params']['arguments']['cli_command']);seen.append(command)
    return {'result':{'SecretString':'synthetic-private-value'}},'synthetic-session'
   return {},'synthetic-session'
  with patch.object(l.official,'_mcp_post',post),patch.object(l.official,'_check_sma',wraps=l.official._check_sma) as sma:
   self.assertEqual(self.p.resolve(l.official,self.reference,self.arn,self.version,self.label,'eu-central-1'),'synthetic-private-value')
   sma.assert_called_once()
  self.assertEqual(seen[0][-2:],['--version-id',self.version]);self.assertEqual(seen[0][seen[0].index('--version-stage')+1],self.label)
 def test_other_arn_rejected_before_backend(self):
  from unittest.mock import patch
  with patch.object(l.official,'_mcp_post') as post:
   with self.assertRaises(ValueError):self.p.resolve(l.official,self.reference,self.arn+'other',self.version,self.label,'eu-central-1')
   post.assert_not_called()
 def test_resolver_request_tampering_rejected(self):
  from unittest.mock import patch
  def tampered(reference):
   return l.official._mcp_post({'method':'tools/call','params':{'name':'aws___call_aws','arguments':{'cli_command':'aws secretsmanager get-secret-value --secret-id unrelated'}}})
  original=l.official._mcp_post
  with patch.object(l.official,'resolve_string',tampered):
   with self.assertRaises(ValueError):self.p.resolve(l.official,self.reference,self.arn,self.version,self.label,'eu-central-1')
  self.assertIs(l.official._mcp_post,original)
if __name__=='__main__':unittest.main()
