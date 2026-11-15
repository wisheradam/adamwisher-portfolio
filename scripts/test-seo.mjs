import {PGlite} from '@electric-sql/pglite';
import {strict as assert} from 'node:assert';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import ts from 'typescript';
const require=createRequire(import.meta.url),db=new PGlite(),cache=new Map();let assertions=0,unavailable=false;
const store={query:async(sql,values=[])=>{if(unavailable)throw new Error('Storage unavailable');return (await db.query(sql,values)).rows;}};
function load(file){file=path.normalize(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const js=ts.transpileModule(readFileSync(file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(js,{exports,process,URL,require:id=>id==='server-only'?{}:id==='./db'||id==='@/lib/admin/db'?{store}:id.startsWith('@/')?load(id.slice(2)):id.startsWith('.')?load(path.join(path.dirname(file),id)):require(id)},{filename:file});return exports;}
const eq=(a,b)=>{assert.equal(a,b);assertions++;};
try{
 for(const f of readdirSync('lib/admin/migrations').sort())await db.exec(readFileSync('lib/admin/migrations/'+f,'utf8'));
 const {STATIC_PAGES,completeMetadata}=load('lib/seo/site'),{metadataForPath,resolvePublicPage,sitemapPages}=load('lib/seo/public-pages');
 process.env.PUBLIC_CONTENT_SOURCE='static';unavailable=true;
 eq((await sitemapPages()).length,Object.keys(STATIC_PAGES).length);
 for(const path of ['/admin','/admin/preview/apps/private','/projects','/mail','/missing','__proto__','//example.com','/apps/bad%2fslug','/apps/a?secret=draft'])eq(await resolvePublicPage(path),null);
 const root=completeMetadata('/',{title:'Root',description:'Description'});eq(root.alternates.canonical,'https://adamwisher.com');eq(root.twitter.card,'summary_large_image');eq(root.openGraph.images[0].width,1200);
 unavailable=false;process.env.PUBLIC_CONTENT_SOURCE='database';
 const now='2026-01-01T00:00:00.000Z';
 await db.query("INSERT INTO products(id,slug,title,type,status,visibility,created_at,updated_at,updated_by) VALUES('app','synthetic-seo','Working draft secret','WEB_APP','DRAFT','PRIVATE',$1,$1,'actor')",[now]);
 const payload={id:'app',slug:'synthetic-seo',title:'Approved App',summary:'Approved description',visibility:'PUBLIC',updated_at:now};
 await db.query("INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by) VALUES('products','app',$1,$2,'actor')",[JSON.stringify(payload),now]);
 eq((await resolvePublicPage('/apps/synthetic-seo')).title,'Approved App | Adam Wisher');
 const m=await metadataForPath('/apps/synthetic-seo');eq(m.twitter.title,'Approved App | Adam Wisher');eq(JSON.stringify(m).includes('secret'),false);eq(m.alternates.canonical,'https://adamwisher.com/apps/synthetic-seo');
 eq((await sitemapPages()).some(p=>p.path==='/apps/synthetic-seo'),true);
 await db.query("INSERT INTO seo_metadata(id,path,seo_title,og_title,indexable,followable,created_at,updated_at,updated_by) VALUES('seo','/apps/synthetic-seo','Search title','Share title',FALSE,TRUE,$1,$1,'actor')",[now]);
 const override=await metadataForPath('/apps/synthetic-seo');eq(override.robots.index,false);eq(override.title,'Search title');eq(override.openGraph.title,'Share title');eq(override.twitter.title,'Share title');eq((await sitemapPages()).some(p=>p.path==='/apps/synthetic-seo'),false);
 await db.query("INSERT INTO seo_metadata(id,path,seo_title,indexable,created_at,updated_at,updated_by) VALUES('private-seo','/apps/private','Private SEO secret',TRUE,$1,$1,'actor')",[now]);
 eq((await metadataForPath('/apps/private')).robots.index,false);eq(JSON.stringify(await metadataForPath('/apps/private')).includes('Private SEO secret'),false);
 await db.query("DELETE FROM publication_snapshots WHERE entity_id='app'");eq(await resolvePublicPage('/apps/synthetic-seo'),null);eq((await sitemapPages()).some(p=>p.path==='/apps/synthetic-seo'),false);
 unavailable=true;await assert.rejects(sitemapPages(),/Storage unavailable/);assertions++;
 console.log(`SEO policy: ${assertions} assertions passed (static independence, canonical/social metadata, snapshot isolation, noindex overrides, private-route rejection, unpublish and failure propagation).`);
}finally{await db.close();}
