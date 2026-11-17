import contextlib,copy,importlib.util,unittest
s=importlib.util.spec_from_file_location('p','scripts/neon-ec2-protocol.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
PLAN=dict(account='533267008693',region='eu-central-1',source_branch='br-wispy-darkness-b91vydbj',target_branch='br-isolated',source_endpoint='ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech',target_endpoint='ep-isolated.c-7.eu-central-1.aws.neon.tech',source_cidr='1.2.3.4/32',target_cidr='1.2.3.5/32')
class Adapter:
 def __init__(self,fail=None): self.fail=fail;self.cleaned=False;self.writes=0;self.retained={'v1':b'synthetic-encrypted'};self.key=b'independent';self.orphans=[]
 def check(self,name):
  if self.fail==name: raise p.Stop('synthetic failure')
 def attest(self,x): self.check('attest')
 def preflight(self,x): self.check('credentials')
 def verify_independent_key(self): self.check('key');p.require(self.key)
 def empty_target(self): return self.fail!='nonempty'
 @contextlib.contextmanager
 def source_snapshot(self): yield 'snapshot'
 def integrity(self,side,snapshot): return 'changed' if self.fail=='integrity' and side=='target' else 'same'
 def upload_encrypted(self,snapshot): self.check('upload');return 'v1'
 def verify_retained(self,v): p.require(v in self.retained)
 def fetch_version(self,v): self.check('download');return self.retained[v]
 def authenticate(self,x): self.check('corrupt')
 def restore_transactionally(self,x): self.check('restore');self.writes+=1
 def abort_incomplete_uploads(self): self.cleaned=True
 def clean_private_temporary_storage(self): self.cleaned=True
 def delete_disposable_stack(self,x): self.check('delete')
 def temporary_resources(self,x): return ['orphan'] if self.fail=='orphan' else []
 def revoke_temporary_credentials(self): self.check('revoke')
class Tests(unittest.TestCase):
 def test_success(self):
  a=Adapter();self.assertTrue(p.recover(a,PLAN,p.fingerprint(PLAN))['integrity_match']);self.assertTrue(a.cleaned)
 def test_failure_matrix(self):
  for f in ['attest','credentials','key','nonempty','upload','download','corrupt','restore','integrity']:
   with self.subTest(f=f):
    a=Adapter(f)
    with self.assertRaises(p.Stop): p.recover(a,PLAN,p.fingerprint(PLAN))
    if f in ['upload','download','corrupt','restore','integrity']: self.assertTrue(a.cleaned)
    if f in ['corrupt','upload','credentials']: self.assertEqual(a.writes,0)
 def test_approval(self):
  with self.assertRaises(p.Stop):p.recover(Adapter(),PLAN,'unapproved')
 def test_production(self):
  c=dict(PLAN,target_branch='br-summer-bird-b915xsws')
  with self.assertRaises(p.Stop):p.fingerprint(c)
 def test_dns_change(self):
  with self.assertRaises(p.Stop):p.verify_dns(PLAN,lambda h:('','',['9.9.9.9']))
 def test_teardown_survival(self):
  a=Adapter();r=dict(account=PLAN['account'],region=PLAN['region'],stack_name='adam-neon-recovery-test',archive_version='v1');self.assertTrue(p.teardown(a,r)['key_recoverable']);self.assertTrue(a.retained)
 def test_orphans_fail(self):
  with self.assertRaises(p.Stop):p.teardown(Adapter('orphan'),dict(account=PLAN['account'],region=PLAN['region'],stack_name='adam-neon-recovery-test',archive_version='v1'))
if __name__=='__main__':unittest.main()
