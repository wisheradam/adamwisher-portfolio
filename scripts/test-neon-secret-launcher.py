import importlib.util,unittest
s=importlib.util.spec_from_file_location('l','scripts/neon-secret-launcher.py');l=importlib.util.module_from_spec(s);s.loader.exec_module(l)
class Tests(unittest.TestCase):
 def test_no_secret_in_argv(self):
  seen={}
  def execute(args,**kw):seen.update(args=args,env=dict(kw['env']));return type('R',(),{'returncode':0})()
  refs={k:'{{resolve:secretsmanager:synthetic}}' for k in ['RECOVERY_CONFIGURATION','RECOVERY_IDENTITY']}
  self.assertEqual(l.launch(['python3','trusted.py'],refs,resolver=lambda x:'synthetic-private-value',execute=execute),0)
  self.assertNotIn('synthetic-private-value',str(seen['args']));self.assertEqual(seen['env']['RECOVERY_IDENTITY'],'synthetic-private-value')
 def test_plaintext_rejected(self):
  with self.assertRaises(ValueError):l.launch([],{'RECOVERY_CONFIGURATION':'plain','RECOVERY_IDENTITY':'plain'})
if __name__=='__main__':unittest.main()
