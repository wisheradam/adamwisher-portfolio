import importlib.util
import unittest
from pathlib import Path
s=importlib.util.spec_from_file_location('t',Path('infra/recovery/template.py'));t=importlib.util.module_from_spec(s);s.loader.exec_module(t)
class Guards(unittest.TestCase):
 def setUp(self): self.r=t.template()['Resources']
 def test_encryption(self): self.assertTrue(self.r['Runner']['Properties']['BlockDeviceMappings'][0]['Ebs']['Encrypted'])
 def test_imds(self): self.assertEqual(self.r['Runner']['Properties']['MetadataOptions']['HttpTokens'],'required')
 def test_no_ingress(self): self.assertEqual(self.r['SecurityGroup']['Properties']['SecurityGroupIngress'],[])
 def test_no_ssh(self): self.assertNotIn('KeyName',self.r['Runner']['Properties'])
 def test_retention(self): self.assertEqual(self.r['Archive']['DeletionPolicy'],'Retain')
 def test_no_nat(self): self.assertFalse(any('NATGateway' in x['Type'] or 'VPCEndpoint' in x['Type'] for x in self.r.values()))
 def test_no_secrets(self): self.assertNotIn('UserData',self.r['Runner']['Properties'])
 def test_cpu_cap(self): self.assertEqual(self.r['Runner']['Properties']['CreditSpecification']['CPUCredits'],'standard')
 def test_delete_volume(self): self.assertTrue(self.r['Runner']['Properties']['BlockDeviceMappings'][0]['Ebs']['DeleteOnTermination'])
 def test_private_bucket(self): self.assertTrue(all(self.r['Archive']['Properties']['PublicAccessBlockConfiguration'].values()))
if __name__=='__main__': unittest.main()
