"""Testable recovery transaction protocol; adapters must never log private arguments."""
import hashlib
import ipaddress
import json
import socket

class Stop(RuntimeError): pass

def require(ok):
 if not ok: raise Stop('Recovery gate failed; private diagnostics suppressed')

def fingerprint(plan):
 require(plan['account']=='533267008693' and plan['region']=='eu-central-1')
 require(plan['source_branch']=='br-wispy-darkness-b91vydbj')
 require(plan['target_branch'] not in [plan['source_branch'],'br-summer-bird-b915xsws'])
 require(plan['source_endpoint']!=plan['target_endpoint'])
 require(plan['source_endpoint'].startswith('ep-morning-dew-b97in9dm.'))
 for host in [plan['source_endpoint'],plan['target_endpoint']]:
  require(host.endswith('.neon.tech') and '-pooler.' not in host)
 return hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()

def verify_dns(plan,resolve=socket.gethostbyname_ex):
 for side in ['source','target']:
  observed=set(resolve(plan[side+'_endpoint'])[2]);expected={str(ipaddress.ip_network(plan[side+'_cidr']).network_address)}
  require(observed==expected)

def recover(adapter,plan,approval):
 """Content handling occurs only inside a trusted adapter after approval."""
 require(approval==fingerprint(plan))
 adapter.attest(plan);adapter.preflight(plan);adapter.verify_independent_key()
 require(adapter.empty_target())
 version=None
 try:
  with adapter.source_snapshot() as snapshot:
   before=adapter.integrity('source',snapshot)
   # Encrypt as a stream; upload must complete before a version is returned.
   version=adapter.upload_encrypted(snapshot)
  require(bool(version))
  adapter.verify_retained(version)
  # Download THIS S3 version; authenticate entire archive before target writes.
  archive=adapter.fetch_version(version)
  adapter.authenticate(archive)
  require(adapter.empty_target())
  adapter.restore_transactionally(archive)
  require(before==adapter.integrity('target',None))
  adapter.verify_independent_key()
  return {'status':'MATCH','archive_version_verified':True,'archive_version':version,'integrity_match':True}
 finally:
  try: adapter.abort_incomplete_uploads()
  finally: adapter.clean_private_temporary_storage()

def teardown(adapter,receipt):
 require(receipt['account']=='533267008693' and receipt['region']=='eu-central-1')
 require(receipt['stack_name'].startswith('adam-neon-recovery-'))
 adapter.verify_retained(receipt['archive_version']);adapter.verify_independent_key()
 adapter.delete_disposable_stack(receipt['stack_name'])
 require(not adapter.temporary_resources(receipt))
 adapter.revoke_temporary_credentials()
 adapter.verify_retained(receipt['archive_version']);adapter.verify_independent_key()
 return {'temporary_resources_absent':True,'archive_retained':True,'key_recoverable':True}
