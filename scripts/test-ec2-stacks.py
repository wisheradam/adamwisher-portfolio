import importlib.util,json,unittest
s=importlib.util.spec_from_file_location('s','infra/recovery/stacks.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Stacks(unittest.TestCase):
 def setUp(self):self.s=m.stacks();self.r=self.s['runner']['Resources'];self.v=self.s['vault']['Resources']
 def test_separate_retention(self):
  self.assertNotIn('Archive',self.r)
  for name in ['Archive','ArchivePolicy','RecoveryIdentity']:self.assertEqual(self.v[name]['DeletionPolicy'],'Retain')
 def test_ssm_restricted(self):
  self.assertNotIn('ManagedPolicyArns',self.r['Role']['Properties']);self.assertNotIn('ssm:GetParameter',json.dumps(self.r['Role']))
 def test_expiry(self):
  self.assertEqual(self.r['ExpirySchedule']['Properties']['Target']['Arn'],'arn:aws:scheduler:::aws-sdk:ec2:terminateInstances')
  self.assertIn('${Runner}',json.dumps(self.r['ExpiryRole']))
 def test_dual_egress(self):
  self.assertEqual(len(self.r['SecurityGroup']['Properties']['SecurityGroupEgress']),3)
 def test_logs_disabled(self):
  i=self.r['SessionDocument']['Properties']['Content']['inputs'];self.assertEqual(i['s3BucketName'],'');self.assertFalse(i['cloudWatchStreamingEnabled'])
 def test_no_secret_values(self):
  self.assertNotIn('SecretString',json.dumps(self.s));self.assertNotIn('UserData',self.r['Runner']['Properties'])
 def test_no_object_deletion_permission(self):self.assertNotIn('s3:DeleteObject',json.dumps(self.r['Role']))
if __name__=='__main__':unittest.main()
