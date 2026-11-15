// Creates credentials and content only in an explicitly isolated local review DB.
import { randomBytes,scryptSync } from 'node:crypto';
import { writeFileSync,mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const root=mkdtempSync('/tmp/adam-publishing-');const password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex');
const env={ADMIN_DATABASE_DRIVER:'pglite',ADMIN_DB_PATH:root+'/db',ADMIN_TEST_EMAIL:'admin@example.test',ADMIN_BOOTSTRAP_EMAIL:'admin@example.test',ADMIN_TEST_PASSWORD:password,ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`,ADMIN_SESSION_SECRET:randomBytes(48).toString('hex'),PUBLIC_CONTENT_SOURCE:'database',PUBLIC_REDIRECTS_ENABLED:'1',PLAYWRIGHT_EXECUTABLE_PATH:process.env.PLAYWRIGHT_EXECUTABLE_PATH??'/usr/bin/chromium'};
for(const file of ['admin-migrate','admin-bootstrap'])execFileSync(process.execPath,[`scripts/${file}.mjs`],{env:{...process.env,...env},stdio:'ignore'});
const report=JSON.parse(execFileSync(process.execPath,['scripts/admin-import-knowledge.mjs'],{env:{...process.env,...env},encoding:'utf8'}));if(!report.cutoverReady)throw new Error('Cutover fixture failed');env.PUBLIC_KNOWLEDGE_CUTOVER_SHA=report.fingerprint;
writeFileSync(root+'/env.sh',Object.entries(env).map(([key,value])=>`export ${key}='${value}'`).join('\n'),{mode:0o600});console.log(root+'/env.sh');
