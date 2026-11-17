import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {verifyAcceptance} from './neon-recovery-acceptance-guard.mjs';
const plan={source_branch:'br-wispy-darkness-b91vydbj',target_branch:'br-isolated',target_endpoint:'ep-isolated.c-7.eu-central-1.aws.neon.tech',target_database:'isolated'};
const raw=JSON.stringify(plan),fingerprint=createHash('sha256').update(raw).digest('hex');
const receipt={status:'MATCH',fingerprint,target_endpoint:plan.target_endpoint,target_branch:plan.target_branch,target_database:plan.target_database};
const env={RECOVERY_APPROVED_PLAN:raw,RECOVERY_CONFIGURATION:JSON.stringify({app_database_url:`postgresql://synthetic:synthetic@${plan.target_endpoint}/isolated?sslmode=verify-full`})};
const read=(path)=>JSON.stringify(path.endsWith('.recovery.json')?receipt:plan),stat=()=>({isFile:()=>true,mode:0o600,uid:process.getuid()});
const args=['--plan','/private/runtime.json','--approval',fingerprint];
assert.equal(verifyAcceptance(env,args,read,stat).fingerprint,fingerprint);
assert.throws(()=>verifyAcceptance(env,[...args.slice(0,3),'wrong'],read,stat));
assert.throws(()=>verifyAcceptance({...env,RECOVERY_APPROVED_PLAN:undefined},args,read,stat));
for(const field of ['target_endpoint','target_branch','target_database','fingerprint','status']){
 const old=receipt[field];receipt[field]='wrong';assert.throws(()=>verifyAcceptance(env,args,read,stat));receipt[field]=old;
}
for(const value of ['postgresql://synthetic:synthetic@ep-other.neon.tech/isolated?sslmode=verify-full',`postgresql://synthetic:synthetic@${plan.target_endpoint}/unapproved?sslmode=verify-full`])assert.throws(()=>verifyAcceptance({...env,RECOVERY_CONFIGURATION:JSON.stringify({app_database_url:value})},args,read,stat));
assert.throws(()=>verifyAcceptance(env,args,read,()=>({...stat(),mode:0o644})));
console.log('Recovery application approval/target guard: 11 assertions passed (synthetic, no database access).');
