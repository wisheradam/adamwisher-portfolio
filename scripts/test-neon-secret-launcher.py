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
if __name__=='__main__':unittest.main()
