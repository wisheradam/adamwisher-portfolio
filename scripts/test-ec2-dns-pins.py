"""Exact multi-answer DNS review, narrow /32 egress and Linux libpq pin guards."""
import configparser,copy,importlib.util,unittest
from unittest.mock import patch

def load(name,file):
 s=importlib.util.spec_from_file_location(name,'scripts/'+file+'.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
r=load('run','neon-ec2-run');p=r.a.protocol
PLAN=dict(account='533267008693',region='eu-central-1',source_branch='br-wispy-darkness-b91vydbj',target_branch='br-isolated',source_endpoint='ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech',target_endpoint='ep-isolated.c-7.eu-central-1.aws.neon.tech',source_cidr='1.2.3.4/32',target_cidr='1.2.3.5/32',source_dns_answers=['1.2.3.4','1.2.3.5','1.2.3.6'],target_dns_answers=['1.2.3.4','1.2.3.5','1.2.3.6'],source_service='source',target_service='target',source_database='neondb',target_database='recovery',target_role='restore_only',recipient='age1synthetic')
class DNS(unittest.TestCase):
 def setUp(self):self.plan=copy.deepcopy(PLAN)
 def test_full_answer_set_order_is_irrelevant(self):p.verify_dns(self.plan,lambda h:('',[],['1.2.3.6','1.2.3.4','1.2.3.5']))
 def test_added_answer_stops_even_if_pin_survives(self):
  with self.assertRaises(p.Stop):p.verify_dns(self.plan,lambda h:('',[],['1.2.3.4','1.2.3.5','1.2.3.6','9.9.9.9']))
 def test_removed_answer_stops(self):
  with self.assertRaises(p.Stop):p.verify_dns(self.plan,lambda h:('',[],['1.2.3.4','1.2.3.5']))
 def test_pin_must_be_published(self):
  self.plan['source_cidr']='9.9.9.9/32'
  with self.assertRaises(p.Stop):p.approved_dns(self.plan,'source')
 def test_broad_network_rejected(self):
  self.plan['source_cidr']='1.2.3.0/24'
  with self.assertRaises(p.Stop):p.approved_dns(self.plan,'source')
 def test_duplicate_answer_rejected(self):
  self.plan['source_dns_answers'].append('1.2.3.4')
  with self.assertRaises(p.Stop):p.approved_dns(self.plan,'source')
 def test_legacy_single_answer_still_strict(self):
  for side in ['source','target']:self.plan.pop(side+'_dns_answers')
  with self.assertRaises(p.Stop):p.verify_dns(self.plan,lambda h:('',[],['1.2.3.4','1.2.3.5']))
class Services(unittest.TestCase):
 def setUp(self):
  self.plan=copy.deepcopy(PLAN);self.config={'source_service':'source','target_service':'target','recipient':'age1synthetic'}
  self.services=configparser.ConfigParser(interpolation=None)
  for side,ip in [('source','1.2.3.4'),('target','1.2.3.5')]:self.services[side]={'host':self.plan[side+'_endpoint'],'hostaddr':ip,'dbname':self.plan[side+'_database'],'user':'reader' if side=='source' else 'restore_only','sslmode':'verify-full','sslrootcert':'system','port':'5432'}
 def verify(self):r.validate_services(self.plan,self.config,self.services)
 def test_valid_pins_with_hostname_tls(self):self.verify()
 def test_missing_pin_rejected(self):
  del self.services['source']['hostaddr']
  with self.assertRaises(RuntimeError):self.verify()
 def test_alternate_published_ip_still_rejected(self):
  self.services['source']['hostaddr']='1.2.3.6'
  with self.assertRaises(RuntimeError):self.verify()
 def test_unpublished_ip_rejected(self):
  self.services['target']['hostaddr']='9.9.9.9'
  with self.assertRaises(RuntimeError):self.verify()
 def test_hostname_substitution_rejected(self):
  self.services['target']['host']='ep-unapproved.c-7.eu-central-1.aws.neon.tech'
  with self.assertRaises(RuntimeError):self.verify()
 def test_database_substitution_rejected(self):
  self.services['target']['dbname']='other_database'
  with self.assertRaises(RuntimeError):self.verify()
 def test_administrator_role_substitution_rejected(self):
  self.services['target']['user']='neondb_owner'
  with self.assertRaises(RuntimeError):self.verify()
 def test_tls_cannot_be_weakened(self):
  self.services['target']['sslmode']='require'
  with self.assertRaises(RuntimeError):self.verify()
 def test_mac_validator_still_rejects_hostaddr(self):
  with self.assertRaises(RuntimeError):r.a.core.validate_plan({**self.plan,**self.config,'target_endpoint':'ep-isolated'},self.services)
class PlanBindings(unittest.TestCase):
 def setUp(self):
  self.module=load('plans','neon-ec2-plan')
  self.neon={side:{'branch_id':PLAN[side+'_branch'],'endpoint':PLAN[side+'_endpoint'],'database':PLAN[side+'_database'],'dns_answers':PLAN[side+'_dns_answers']} for side in ['source','target']}
  self.neon['target']['role']=PLAN['target_role']
  self.plan={'run_id':'a'*32,'parameters':{'ReviewedAmi':'ami-synthetic','SourceCidr':PLAN['source_cidr'],'TargetCidr':PLAN['target_cidr']},'neon':self.neon}
  self.receipt={'vault_outputs':{'Bucket':'new-vault','KeySecretArn':'new-key'},'runner_outputs':{'DatabaseSecretArn':'new-config'}}
  self.inputs={k:PLAN[k] for k in ['target_branch','target_endpoint','target_database']}
 def test_reviewed_identity_and_dns_derived_without_caller_override(self):
  value=self.module.runtime_plan(self.plan,self.receipt,self.inputs)
  for side in ['source','target']:self.assertEqual(value[side+'_dns_answers'],PLAN[side+'_dns_answers'])
  self.assertEqual(value['target_role'],PLAN['target_role'])
 def test_target_metadata_substitution_rejected(self):
  for key in ['target_branch','target_endpoint','target_database']:
   with self.assertRaises(ValueError):self.module.runtime_plan(self.plan,self.receipt,{**self.inputs,key:'unrelated'})
 def test_fixed_source_metadata_must_match(self):
  self.neon['source']['database']='other'
  with self.assertRaises(ValueError):self.module.runtime_plan(self.plan,self.receipt,self.inputs)
 def test_dns_and_role_cannot_be_overridden(self):
  for key in ['source_dns_answers','target_dns_answers','target_role']:
   with self.assertRaises(ValueError):self.module.runtime_plan(self.plan,self.receipt,{**self.inputs,key:'unrelated'})
 def test_provision_checks_reviewed_dns_before_creation(self):
  with patch.object(p,'verify_dns') as verify:
   p.provision_dns(self.plan)
  self.assertEqual(verify.call_args.args[0]['target_dns_answers'],PLAN['target_dns_answers'])
  self.assertEqual(verify.call_args.args[0]['source_cidr'],PLAN['source_cidr'])
if __name__=='__main__':unittest.main()
