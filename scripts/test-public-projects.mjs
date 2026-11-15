import {strict as assert} from 'node:assert';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const db=new PGlite();let unavailable=false,checks=0;const eq=(a,b)=>{assert.equal(a,b);checks++;};
const load=(file,deps={})=>{const exports={};const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,process,require:id=>{if(id==='server-only')return {};if(id in deps)return deps[id];throw new Error('Unexpected dependency: '+id);}});return exports;};
try{
 for(const file of readdirSync('lib/admin/migrations').sort())await db.exec(readFileSync('lib/admin/migrations/'+file,'utf8'));
 const catalog=load('data/public-projects.ts');const store={query:async(sql,values=[])=>{if(unavailable)throw new Error('Storage unavailable');return (await db.query(sql,values)).rows;}};
 const {publicProjects}=load('lib/public-projects.ts',{'@/data/public-projects':catalog,'@/lib/admin/db':{store}});
 process.env.PUBLIC_CONTENT_SOURCE='static';unavailable=true;const source=await publicProjects();eq(source.length,6);eq(new Set(source.map(p=>p.href)).size,6);
 for(const p of source){eq(p.files.length,2);assert.match(p.href,/^\/work\/[a-z0-9-]+$/);checks++;for(const file of [p.image,p.darkImage]){assert.ok(readFileSync('public'+file).length>0);checks++;}for(const f of p.files){assert.ok(f.href.startsWith('/work/')||f.href.startsWith('/project'));checks++;}}
 unavailable=false;process.env.PUBLIC_CONTENT_SOURCE='database';const now=new Date().toISOString();
 const create=async(id,slug,status,visibility,order=0)=>db.query("INSERT INTO projects(id,slug,title,summary,body,status,visibility,sort_order,created_at,updated_at,updated_by) VALUES($1,$2,$1,'Public summary','PRIVATE_BODY /projects/secret /api/admin/media/secret',$3,$4,$5,$6,$6,'actor')",[id,slug,status,visibility,order,now]);
 await create('public-project','public-project','PUBLISHED','PUBLIC',2);await create('public-first','first-project','PUBLISHED','PUBLIC',1);
 await create('DRAFT_SENTINEL','draft','DRAFT','PUBLIC');await create('PRIVATE_SENTINEL','private','PUBLISHED','PRIVATE');await create('ARCHIVED_SENTINEL','archived','ARCHIVED','PUBLIC');await create('DELETED_SENTINEL','deleted','PUBLISHED','PUBLIC');await db.query("UPDATE projects SET deleted_at=$1 WHERE id='DELETED_SENTINEL'",[now]);
 await create('UNSAFE_SENTINEL','../projects/secret','PUBLISHED','PUBLIC');await create('DUPLICATE_SENTINEL','check2go','PUBLISHED','PUBLIC');
 const all=await publicProjects();eq(all.length,8);eq(all[6].title,'public-first');eq(all[7].title,'public-project');eq(all[7].image,'/og?path=%2Fwork%2Fpublic-project');eq(all[7].files[0].href,'/work/public-project');
 const json=JSON.stringify(all);for(const sentinel of ['DRAFT_SENTINEL','PRIVATE_SENTINEL','ARCHIVED_SENTINEL','DELETED_SENTINEL','UNSAFE_SENTINEL','DUPLICATE_SENTINEL','PRIVATE_BODY','/projects/secret','/api/admin/media/secret','updated_by','created_at','"body"'])eq(json.includes(sentinel),false);
 await db.query("UPDATE projects SET status='DRAFT' WHERE id='public-project'");eq((await publicProjects()).length,7);await db.query("UPDATE projects SET status='PUBLISHED' WHERE id='public-project'");eq((await publicProjects()).length,8);
 unavailable=true;await assert.rejects(publicProjects(),/Storage unavailable/);checks++;
 console.log(`Public project catalog: ${checks} assertions passed (public assets, static fallback, publication/visibility/deletion filters, ordering, reserved slugs, URL safety and private-field exclusion).`);
}finally{await db.close();}
