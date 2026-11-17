import importlib.util,json,tempfile,unittest,sys
from pathlib import Path
from unittest.mock import patch,MagicMock
s=importlib.util.spec_from_file_location('c','scripts/neon-ec2-control.py');c=importlib.util.module_from_spec(s);s.loader.exec_module(c)
class Controls(unittest.TestCase):
 def runplan(self,plan,mode,approval=None,boto=None):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'plan.json';p.write_text(json.dumps(plan));argv=['control',mode,'--plan',str(p)]
   if approval:argv+=['--approval',approval]
   with patch.object(sys,'argv',argv),patch.dict(sys.modules,{'boto3':boto or MagicMock()}):return c.main()
 def setUp(self):self.p=dict(account=c.ACCOUNT,region=c.REGION,runner_stack='adam-neon-recovery-test',vault_stack='adam-neon-vault-test')
 def test_bad_account(self):self.assertEqual(self.runplan({**self.p,'account':'other'},'plan'),1)
 def test_bad_approval_no_mutations(self):
  b=MagicMock();self.assertEqual(self.runplan(self.p,'provision','wrong',b),1);b.client.assert_not_called()
 def test_cross_stack_rejected(self):self.assertEqual(self.runplan({**self.p,'vault_stack':self.p['runner_stack']},'plan'),1)
 def test_teardown_requires_recovery_evidence(self):
  b=MagicMock();b.client.return_value.get_caller_identity.return_value={'Account':c.ACCOUNT}
  self.assertEqual(self.runplan(self.p,'teardown',c.digest(self.p),b),1);b.client.return_value.delete_stack.assert_not_called()
if __name__=='__main__':unittest.main()
