"""Synthetic installer failure injection; never installs packages or calls AWS."""
import hashlib,os,shutil,subprocess,tempfile,unittest
from pathlib import Path

PIN='81f573c2a0ace70cfb97aa4d014c17cbd605cb04cbad09adbc7aaf9c0979ae8e'
class Installer(unittest.TestCase):
 def exercise(self,failure=''):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);scripts=root/'scripts';scripts.mkdir();infra=root/'infra/recovery';infra.mkdir(parents=True)
   synthetic=b'synthetic-public-installer-fixture'
   # Only the private test copy uses a synthetic payload digest; shipping pins stay fixed.
   script=Path('scripts/neon-install-aws-cli.sh').read_text().replace(PIN,hashlib.sha256(synthetic).hexdigest())
   (scripts/'install.sh').write_text(script)
   key=Path('infra/recovery/aws-cli-public-key.asc').read_text()
   (infra/'aws-cli-public-key.asc').write_text('invalid fixture key' if failure=='key' else key)
   tools=root/'bin';tools.mkdir();stage=root/'stage';stage.mkdir();marker=root/'installed';extracted=root/'extracted'
   stubs={
    'curl':'''#!/usr/bin/env python3
import os,sys
from pathlib import Path
if os.environ['CASE']=='download':sys.exit(42)
out=Path(sys.argv[sys.argv.index('-o')+1])
out.write_bytes(b'corrupted fixture' if os.environ['CASE']=='hash' else b'synthetic-public-installer-fixture')
''',
    'gpg':'''#!/usr/bin/env python3
import os,sys
if '--verify' not in sys.argv:os.execv(os.environ['REAL_GPG'],[os.environ['REAL_GPG'],*sys.argv[1:]])
if os.environ['CASE']=='signature':sys.exit(1)
key='UNAPPROVED' if os.environ['CASE']=='signer' else 'FB5DB77FD5C118B80511ADA8A6310ACC4672475C'
print('[GNUPG:] VALIDSIG '+key+' fixture')
if os.environ['CASE']=='expired':print('[GNUPG:] EXPKEYSIG fixture')
''',
    'unzip':'''#!/usr/bin/env python3
import os,sys
from pathlib import Path
Path(os.environ['EXTRACTED']).touch()
out=Path(sys.argv[sys.argv.index('-d')+1])/'aws';(out/'dist').mkdir(parents=True)
cli=out/'dist/aws';cli.write_text('#!/bin/sh\\necho aws-cli/'+('0.0.0' if os.environ['CASE']=='version' else '2.40.4')+' fixture\\n');cli.chmod(0o700)
installer=out/'install';installer.write_text('#!/bin/sh\\nif [ "$CASE" = installer ]; then exit 1; fi\\ntouch "$MARKER"\\n');installer.chmod(0o700)
'''}
   for name,body in stubs.items():
    p=tools/name;p.write_text(body);p.chmod(0o700)
   env={**os.environ,'PATH':str(tools)+':'+os.environ['PATH'],'TMPDIR':str(stage),'CASE':failure,'MARKER':str(marker),'EXTRACTED':str(extracted),'REAL_GPG':shutil.which('gpg')}
   result=subprocess.run(['bash',str(scripts/'install.sh')],env=env,capture_output=True)
   self.assertFalse(list(stage.iterdir()),'Installer staging must be removed on every exit')
   return result.returncode,marker.exists(),extracted.exists()
 def rejected(self,case,before_extract=True):
  code,installed,extracted=self.exercise(case);self.assertNotEqual(code,0);self.assertFalse(installed)
  if before_extract:self.assertFalse(extracted)
 def test_verified_fixture_can_install(self):self.assertEqual(self.exercise(),(0,True,True))
 def test_corruption_stops_before_extraction(self):self.rejected('hash')
 def test_unapproved_key_stops_before_extraction(self):self.rejected('key')
 def test_signature_failure_stops_before_extraction(self):self.rejected('signature')
 def test_wrong_signature_identity_stops(self):self.rejected('signer')
 def test_expired_signature_stops(self):self.rejected('expired')
 def test_interrupted_download_cleans_staging(self):self.rejected('download')
 def test_unapproved_version_stops_before_installation(self):self.rejected('version',False)
 def test_installation_failure_is_not_success(self):self.rejected('installer',False)
 def test_noble_bootstrap_does_not_depend_on_missing_apt_package(self):
  bootstrap=Path('scripts/neon-ec2-bootstrap.sh').read_text()
  self.assertNotIn('python3-venv awscli',bootstrap);self.assertIn('neon-install-aws-cli.sh',bootstrap)
if __name__=='__main__':unittest.main()
