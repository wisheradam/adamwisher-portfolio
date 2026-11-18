// Gate BEFORE creating a store, starting a server or consuming credentials.
import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
export function verifyAcceptance(env,args,read=readFileSync,stat=statSync){
 const fail=()=>{throw new Error('Application recovery approval gate failed');};
 if(args.length!==4||args[0]!=='--plan'||args[2]!=='--approval')fail();
 if(!env.RECOVERY_APPROVED_PLAN)fail();
 const info=stat(args[1]);if(!info.isFile()||(info.mode&0o777)!==0o600||info.uid!==process.getuid())fail();
 const raw=env.RECOVERY_APPROVED_PLAN,plan=JSON.parse(raw),disk=JSON.parse(read(args[1],'utf8'));
 // Parent supplies the exact canonical bytes already verified against live ownership.
 const fingerprint=createHash('sha256').update(raw).digest('hex');
 if(fingerprint!==args[3]||!isDeepStrictEqual(plan,disk))fail();
 const receipt=JSON.parse(read(args[1].replace(/\.[^/.]+$/,'')+'.recovery.json','utf8'));
 if(receipt.status!=='MATCH'||receipt.fingerprint!==fingerprint||receipt.target_endpoint!==plan.target_endpoint||receipt.target_branch!==plan.target_branch||receipt.target_database!==plan.target_database)fail();
 const config=JSON.parse(env.RECOVERY_CONFIGURATION??'{}'),url=new URL(config.app_database_url??'');
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.username||!url.password||url.hash||(url.port&&url.port!=='5432'))fail();
 // pg connection strings allow query host/database/user overrides. Reject all overrides and duplicates.
 if([...url.searchParams].length!==1||[...url.searchParams.keys()][0]!=='sslmode')fail();
 if(plan.target_role&&decodeURIComponent(url.username)!==plan.target_role)fail();
 if(url.hostname!==plan.target_endpoint||decodeURIComponent(url.pathname.slice(1))!==plan.target_database||url.searchParams.get('sslmode')!=='verify-full')fail();
 if(plan.source_branch!=='br-wispy-darkness-b91vydbj'||!plan.target_branch?.startsWith('br-')||['br-wispy-darkness-b91vydbj','br-summer-bird-b915xsws'].includes(plan.target_branch))fail();
 if(['ep-morning-dew-b97in9dm','ep-gentle-firefly-b9rgczs1'].includes(url.hostname.replace('-pooler.','.').split('.')[0]))fail();
 return {url:url.toString(),fingerprint};
}
