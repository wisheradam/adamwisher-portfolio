import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {verifyAcceptance} from './neon-recovery-acceptance-guard.mjs';
const plan={source_branch:'br-wispy-darkness-b91vydbj',target_branch:'br-isolated',target_endpoint:'ep-isolated.c-7.eu-central-1.aws.neon.tech',target_database:'isolated'};
const raw=JSON.stringify(plan),fingerprint=createHash('sha256').update(raw).digest('hex');
const receipt={status:'MATCH',fingerprint,target_endpoint:plan.target_endpoint,target_branch:plan.target_branch,target_database:plan.target_database};
const env={RECOVERY_APPROVED_PLAN:raw,RECOVERY_CONFIGURATION:JSON.stringify({app_database_url:`postgresql://synthetic:synthetic@${plan.target_endpoint}/isolated?sslmode=verify-full`})};
const read=(path)=>JSON.stringify(path.endsWith('.recovery.json')?receipt:plan),stat=()=>({isFile:()=>true,mode:0o600,uid:process.getuid()});
let checks=0;const rejects=fn=>{assert.throws(fn);checks++;};
const args=['--plan','/private/runtime.json','--approval',fingerprint];
assert.equal(verifyAcceptance(env,args,read,stat).fingerprint,fingerprint);checks++;
rejects(()=>verifyAcceptance(env,[...args.slice(0,3),'wrong'],read,stat));
rejects(()=>verifyAcceptance({...env,RECOVERY_APPROVED_PLAN:undefined},args,read,stat));
for(const field of ['target_endpoint','target_branch','target_database','fingerprint','status']){
 const old=receipt[field];receipt[field]='wrong';rejects(()=>verifyAcceptance(env,args,read,stat));receipt[field]=old;
}
for(const value of ['postgresql://synthetic:synthetic@ep-other.neon.tech/isolated?sslmode=verify-full',`postgresql://synthetic:synthetic@${plan.target_endpoint}/unapproved?sslmode=verify-full`])rejects(()=>verifyAcceptance({...env,RECOVERY_CONFIGURATION:JSON.stringify({app_database_url:value})},args,read,stat));
rejects(()=>verifyAcceptance(env,args,read,()=>({...stat(),mode:0o644})));
for(const query of ['host=ep-unapproved.neon.tech','port=5433','dbname=unapproved','database=unapproved','user=unapproved','options=unapproved','sslmode=require']){
 const config=JSON.parse(env.RECOVERY_CONFIGURATION);config.app_database_url+='&'+query;
 rejects(()=>verifyAcceptance({...env,RECOVERY_CONFIGURATION:JSON.stringify(config)},args,read,stat));
}
for(const value of [`https://synthetic:synthetic@${plan.target_endpoint}/isolated?sslmode=verify-full`,`postgresql://synthetic:synthetic@${plan.target_endpoint}:5433/isolated?sslmode=verify-full`,`postgresql://synthetic:synthetic@${plan.target_endpoint}/isolated?sslmode=verify-full#unapproved`])rejects(()=>verifyAcceptance({...env,RECOVERY_CONFIGURATION:JSON.stringify({app_database_url:value})},args,read,stat));
const rolePlan={...plan,target_role:'synthetic'},roleRaw=JSON.stringify(rolePlan),roleHash=createHash('sha256').update(roleRaw).digest('hex');
const roleReceipt={...receipt,fingerprint:roleHash};
const roleRead=path=>JSON.stringify(path.endsWith('.recovery.json')?roleReceipt:rolePlan);
const roleEnv={...env,RECOVERY_APPROVED_PLAN:roleRaw},roleArgs=['--plan','/private/runtime.json','--approval',roleHash];
assert.equal(verifyAcceptance(roleEnv,roleArgs,roleRead,stat).fingerprint,roleHash);checks++;
const wrongRoleConfig=JSON.parse(env.RECOVERY_CONFIGURATION);wrongRoleConfig.app_database_url=wrongRoleConfig.app_database_url.replace('synthetic:synthetic@','unapproved:synthetic@');
rejects(()=>verifyAcceptance({...roleEnv,RECOVERY_CONFIGURATION:JSON.stringify(wrongRoleConfig)},roleArgs,roleRead,stat));
console.log(`Recovery application approval/target guard: ${checks} assertions passed (synthetic, no database access).`);
