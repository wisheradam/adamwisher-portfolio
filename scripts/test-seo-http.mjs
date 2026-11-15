import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes,scryptSync,createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {strict as assert} from 'node:assert';
const root=await mkdtemp(path.join(tmpdir(),'adam-seo-http-')),password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex'),port=34826,base=`http://127.0.0.1:${port}`;
const env={...process.env,ADMIN_DATABASE_DRIVER:'pglite',ADMIN_DB_PATH:path.join(root,'db'),ADMIN_BOOTSTRAP_EMAIL:'seo@example.test',ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`,PUBLIC_CONTENT_SOURCE:'database',PUBLIC_REDIRECTS_ENABLED:'0'};
let server,checks=0;const eq=(a,b)=>{assert.equal(a,b);checks++;};const ok=v=>{assert.ok(v);checks++;};
const request=(url,options={})=>fetch(base+url,{headers:{'user-agent':'Twitterbot'},...options});
const meta=(html,name)=>Array.from(html.matchAll(/<meta\b[^>]*>/g),m=>m[0]).find(tag=>tag.includes(`name="${name}"`)||tag.includes(`property="${name}"`))?.match(/content="([^"]*)"/)?.[1];
async function start(){server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env,stdio:'ignore'});for(let n=0;n<100;n++){try{await request('/robots.txt');return;}catch{await new Promise(r=>setTimeout(r,100));}}throw new Error('SEO server not ready');}
async function stop(){if(server?.exitCode===null){server.kill();await new Promise(r=>server.once('exit',r));}}
try{
 for(const name of ['admin-migrate','admin-bootstrap'])execFileSync(process.execPath,[`scripts/${name}.mjs`],{env,stdio:'ignore'});
 const report=JSON.parse(execFileSync(process.execPath,['scripts/admin-import-knowledge.mjs'],{env,encoding:'utf8'}));env.PUBLIC_KNOWLEDGE_CUTOVER_SHA=report.fingerprint;
 await start();const login=await request('/api/admin/login',{method:'POST',headers:{'content-type':'application/json',origin:base},body:JSON.stringify({email:'seo@example.test',password})});eq(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0],headers={'content-type':'application/json',origin:base,cookie};
 const create=async(url,data)=>{const r=await request(url,{method:'POST',headers,body:JSON.stringify(data)});eq(r.status,201);return r.json();};
 const patch=async(url,data)=>{const r=await request(url,{method:'PATCH',headers,body:JSON.stringify(data)});eq(r.status,200);return r.json();};
 const rootSeo=await create('/api/admin/modules/seo',{path:'/',canonical_url:'https://adamwisher.com',indexable:true});ok((await (await request('/')).text()).includes('rel="canonical" href="https://adamwisher.com"'));eq((await request('/api/admin/modules/seo/'+rootSeo.id,{method:'DELETE',headers})).status,204);
 const app=await create('/api/admin/records/products',{slug:'synthetic-seo-http',title:'SEO approved v1',summary:'Approved description',type:'WEB_APP',status:'PUBLISHED',visibility:'PUBLIC'}),url='/apps/synthetic-seo-http',image='/og?path='+encodeURIComponent(url);
 const html=await (await request(url)).text();eq(meta(html,'og:title'),'SEO approved v1 | Adam Wisher');eq(meta(html,'twitter:card'),'summary_large_image');eq(meta(html,'og:url'),'https://adamwisher.com'+url);ok(html.includes(`rel="canonical" href="https://adamwisher.com${url}"`));
 const png=await request(image);eq(png.status,200);eq(png.headers.get('content-type'),'image/png');ok(png.headers.get('cache-control').includes('no-store'));const bytes=Buffer.from(await png.arrayBuffer());eq(bytes.readUInt32BE(16),1200);eq(bytes.readUInt32BE(20),630);const digest=b=>createHash('sha256').update(b).digest('hex');
 await patch('/api/admin/records/products/'+app.id,{title:'SEO private v2',summary:'Private draft description',status:'DRAFT'});
 const draftHtml=await (await request(url)).text();ok(draftHtml.includes('SEO approved v1'));eq(draftHtml.includes('SEO private v2'),false);eq(digest(Buffer.from(await (await request(image)).arrayBuffer())),digest(bytes));ok((await (await request('/sitemap.xml')).text()).includes('https://adamwisher.com'+url));
 const seo=await create('/api/admin/modules/seo',{path:url,seo_title:'SEO search override',og_title:'SEO share override',indexable:false,followable:false});
 const overridden=await (await request(url)).text();eq(meta(overridden,'og:title'),'SEO share override');eq(meta(overridden,'twitter:title'),'SEO share override');ok(meta(overridden,'robots').includes('noindex'));eq((await (await request('/sitemap.xml')).text()).includes('https://adamwisher.com'+url),false);
 eq((await request('/api/admin/modules/seo/'+seo.id,{method:'DELETE',headers})).status,204);
 await patch('/api/admin/records/products/'+app.id,{status:'PUBLISHED'});eq(meta(await (await request(url)).text(),'og:title'),'SEO private v2 | Adam Wisher');
 const release=await create('/api/admin/modules/releases',{title:'Synthetic public release',version:'1',product_id:app.id,status:'PUBLISHED',visibility:'PUBLIC'});const changelog=url+'/changelog';eq((await request(changelog)).status,200);ok((await (await request('/sitemap.xml')).text()).includes(changelog));
 await patch('/api/admin/records/products/'+app.id,{status:'ARCHIVED'});eq((await request(url)).status,404);eq((await request(changelog)).status,404);eq((await request(image)).status,404);const removed=await (await request('/sitemap.xml')).text();eq(removed.includes(url),false);
 for(const p of ['/admin','/admin/preview/apps/'+app.id,'/projects','/mail','/api/admin/records/products']){const r=await request(p,{redirect:'manual'});ok(r.headers.get('x-robots-tag')?.includes('noindex'));eq(removed.includes(`<loc>https://adamwisher.com${p}</loc>`),false);}
 for(const p of ['/admin','/projects','/apps/missing','__proto__','//other.example'])eq((await request('/og?path='+encodeURIComponent(p))).status,404);
 const robot=await (await request('/robots.txt')).text();ok(robot.includes('Sitemap: https://adamwisher.com/sitemap.xml'));ok(robot.includes('Disallow: /admin'));
 await request('/api/admin/modules/releases/'+release.id,{method:'DELETE',headers});await request('/api/admin/records/products/'+app.id,{method:'DELETE',headers});
 await stop();env.PUBLIC_CONTENT_SOURCE='static';env.PUBLIC_KNOWLEDGE_CUTOVER_SHA='mismatch';env.ADMIN_DB_PATH='/nonexistent/seo-static-must-not-open';await start();const staticMap=await request('/sitemap.xml');eq(staticMap.status,200);const staticXml=await staticMap.text();eq((staticXml.match(/<loc>/g)??[]).length,11);eq(staticXml.includes('/apps/'),false);eq((await request('/education')).status,200);eq((await request('/og?path=%2Fabout')).status,200);
 console.log(`SEO HTTP: ${checks} assertions passed (real PNG, metadata, Draft isolation, overrides, sitemap freshness, parent privacy, noindex headers, static fallback).`);
}finally{await stop();await rm(root,{recursive:true,force:true});}
