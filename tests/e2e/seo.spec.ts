import {test,expect,type Page} from '@playwright/test';
const canonical=(path:string)=>`https://adamwisher.com${path}`;
const statics=['/','/about','/education','/work','/contact','/work/single-source-of-truth','/work/check2go','/work/innova-knowledge-base','/work/business-systems-transformation','/work/ai-support-assistant','/work/prescription-medication-marketplace'];
async function login(page:Page){await page.goto('/admin/login');await page.getByLabel('Email').fill(process.env.ADMIN_TEST_EMAIL??'admin@example.test');await page.getByLabel('Password').fill(process.env.ADMIN_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/admin$/);}
async function social(page:Page,path:string){
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',canonical(path));
 const title=await page.title();expect(title).toBeTruthy();
 await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content',title);
 await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content',canonical(path));
 await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content','website');
 await expect(page.locator('meta[name="description"]')).toHaveAttribute('content',/.+/);
 await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content','summary_large_image');
 await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content',title);
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',canonical('/og')+'?path='+encodeURIComponent(path));
 await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content',canonical('/og')+'?path='+encodeURIComponent(path));
}

test('all source-controlled public pages expose canonical and complete social metadata',async({page,request})=>{
 for(const path of statics){const response=await page.goto(path+'?utm_source=synthetic');expect(response?.status()).toBe(200);await social(page,path);await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','index, follow');}
 const response=await request.get('/sitemap.xml');expect(response.status()).toBe(200);expect(response.headers()['cache-control']).toContain('no-store');const xml=await response.text();for(const path of statics)expect(xml).toContain(`<loc>${canonical(path)}</loc>`);expect(xml).not.toContain('utm_source');
 const robots=await request.get('/robots.txt');expect(robots.status()).toBe(200);expect(await robots.text()).toContain('Sitemap: https://adamwisher.com/sitemap.xml');
 const image=await request.get('/og?path=%2Fabout');expect(image.status()).toBe(200);expect(image.headers()['content-type']).toBe('image/png');const bytes=await image.body();expect(bytes.readUInt32BE(16)).toBe(1200);expect(bytes.readUInt32BE(20)).toBe(630);
});

test('Admin SEO, published snapshots, social images and sitemap follow the UI lifecycle',async({page,browser})=>{
 page.setDefaultTimeout(10000);await login(page);const origin=new URL(page.url()).origin,tag=`synthetic-seo-${Date.now()}`,path=`/apps/${tag}`,v1=`${tag} v1`,v2=`${tag} draft v2`;let id='',seoId='',releaseId='';
 const publicPage=await browser.newPage();const headers={Origin:origin};const image='/og?path='+encodeURIComponent(path);
 try{
  await page.goto('/admin/apps');await page.getByRole('button',{name:'New app',exact:true}).click();const form=page.locator('form.admin-editor');await form.getByLabel('Title',{exact:true}).fill(v1);await form.getByLabel('Slug').fill(tag);await form.getByLabel('Summary').fill('Approved synthetic description');await form.getByLabel('Visibility').selectOption('PUBLIC');
  const created=page.waitForResponse(r=>r.url().endsWith('/api/admin/records/products')&&r.request().method()==='POST');await form.getByRole('button',{name:'Save draft',exact:true}).click();const response=await created;expect(response.status()).toBe(201);id=(await response.json()).id;await expect(form).toHaveCount(0);
  await page.getByLabel('Search',{exact:true}).fill(tag);const row=page.locator('tbody tr').filter({hasText:tag});await expect(row).toHaveCount(1);
  expect((await publicPage.goto(path))?.status()).toBe(404);await expect(publicPage.locator('meta[name="robots"]').first()).toHaveAttribute('content',/noindex/);expect((await publicPage.request.get(image)).status()).toBe(404);
  await row.getByRole('button',{name:'Publish',exact:true}).click();await expect(row).toContainText('Published');await publicPage.goto(path);await social(publicPage,path);expect(await publicPage.title()).toBe(v1+' | Adam Wisher');
  const before=await (await publicPage.request.get('/sitemap.xml')).text();expect(before).toContain(`<loc>${canonical(path)}</loc>`);
  const oldEntry=before.match(new RegExp('<url>\\s*<loc>'+canonical(path)+'</loc>[\\s\\S]*?</url>'))?.[0];expect(oldEntry).toBeTruthy();
  await row.getByRole('button',{name:'Edit',exact:true}).click();await form.getByLabel('Title',{exact:true}).fill(v2);await form.getByLabel('Summary').fill('Unapproved draft secret');await form.getByRole('button',{name:'Save draft',exact:true}).click();await expect(form).toHaveCount(0);await expect(row).toContainText('unpublished changes');
  await publicPage.reload();await social(publicPage,path);expect(await publicPage.title()).toBe(v1+' | Adam Wisher');expect(await (await publicPage.request.get(path)).text()).not.toContain('Unapproved draft secret');expect(await (await publicPage.request.get('/sitemap.xml')).text()).toContain(oldEntry!);
  // Use the existing SEO form, including its persisted indexability controls.
  await page.goto('/admin/seo');await page.getByRole('button',{name:'New record',exact:true}).click();const seoForm=page.locator('form.admin-editor');await seoForm.getByLabel('Page path').fill(path);await seoForm.getByLabel('SEO title',{exact:true}).fill('Synthetic search title');await seoForm.getByLabel('Open Graph title',{exact:true}).fill('Synthetic share title');await expect(seoForm.getByLabel('Indexable')).toBeChecked();await seoForm.getByLabel('Indexable').uncheck();
  const seoCreated=page.waitForResponse(r=>r.url().endsWith('/api/admin/modules/seo')&&r.request().method()==='POST');await seoForm.getByRole('button',{name:'Save',exact:true}).click();const seoResponse=await seoCreated;expect(seoResponse.status()).toBe(201);seoId=(await seoResponse.json()).id;await expect(seoForm).toHaveCount(0);
  await publicPage.reload();await expect(publicPage).toHaveTitle('Synthetic search title');await expect(publicPage.locator('meta[property="og:title"]')).toHaveAttribute('content','Synthetic share title');await expect(publicPage.locator('meta[name="twitter:title"]')).toHaveAttribute('content','Synthetic share title');await expect(publicPage.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);expect(await (await publicPage.request.get('/sitemap.xml')).text()).not.toContain(`<loc>${canonical(path)}</loc>`);
  expect((await page.request.delete(`/api/admin/modules/seo/${seoId}`,{headers})).status()).toBe(204);seoId='';
  await page.goto('/admin/apps');await page.getByLabel('Search',{exact:true}).fill(tag);await row.getByRole('button',{name:'Publish',exact:true}).click();await expect(row).not.toContainText('unpublished changes');await publicPage.reload();await social(publicPage,path);await expect(publicPage).toHaveTitle(v2+' | Adam Wisher');
  const release=await page.request.post('/api/admin/modules/releases',{headers,data:{title:'Synthetic related release',version:'1',product_id:id,status:'PUBLISHED',visibility:'PUBLIC'}});expect(release.status()).toBe(201);releaseId=(await release.json()).id;await publicPage.goto(path+'/changelog');await social(publicPage,path+'/changelog');
  await row.getByRole('button',{name:'Unpublish',exact:true}).click();await expect(row).toContainText('Unpublished');expect((await publicPage.goto(path))?.status()).toBe(404);expect((await publicPage.request.get(image)).status()).toBe(404);expect((await publicPage.request.get(path+'/changelog')).status()).toBe(404);expect(await (await publicPage.request.get('/sitemap.xml')).text()).not.toContain(path);expect(await (await publicPage.request.get(path)).text()).not.toContain(v2);
  await row.getByRole('button',{name:'Republish',exact:true}).click();await expect(row).toContainText('Published');await publicPage.goto(path);await social(publicPage,path);await expect(publicPage).toHaveTitle(v2+' | Adam Wisher');
 }finally{
  if(seoId)expect((await page.request.delete(`/api/admin/modules/seo/${seoId}`,{headers})).status()).toBe(204);
  if(releaseId)expect((await page.request.delete(`/api/admin/modules/releases/${releaseId}`,{headers})).status()).toBe(204);
  if(id)expect((await page.request.delete(`/api/admin/records/products/${id}`,{headers})).status()).toBe(204);
  await publicPage.close();
 }
});

test('private, missing, disabled and legacy managed routes have safe SEO eligibility',async({page,request})=>{
 await login(page);const origin=new URL(page.url()).origin,tag=`synthetic-discovery-${Date.now()}`,headers={Origin:origin},records:{url:string;id:string}[]=[];
 const create=async(url:string,data:unknown)=>{const r=await page.request.post(url,{headers,data});expect(r.status()).toBe(201);const row=await r.json();records.push({url,id:row.id});return row;};
 try{
  for(const [suffix,status,visibility] of [['draft','DRAFT','PUBLIC'],['private','PUBLISHED','PRIVATE'],['archived','ARCHIVED','PUBLIC']] as const)await create('/api/admin/records/products',{slug:`${tag}-${suffix}`,title:'Private SEO sentinel',type:'WEB_APP',status,visibility});
  const app=await create('/api/admin/records/products',{slug:tag,title:'Public discoverable app',type:'WEB_APP',status:'PUBLISHED',visibility:'PUBLIC'});
  const project=await create('/api/admin/records/projects',{slug:tag,title:'Legacy published project',summary:'Public legacy summary',status:'PUBLISHED',visibility:'PUBLIC'});
  await page.goto('/work/'+tag);await social(page,'/work/'+tag);expect(await page.title()).toBe('Legacy published project — Adam Wisher');
  const seo=await create('/api/admin/modules/seo',{path:`/apps/${tag}-draft`,seo_title:'Private SEO sentinel',indexable:true});
  let xml=await (await request.get('/sitemap.xml')).text();expect(xml).toContain(`<loc>${canonical('/apps/'+tag)}</loc>`);expect(xml).toContain(`<loc>${canonical('/work/'+tag)}</loc>`);for(const suffix of ['draft','private','archived']){const url=`/apps/${tag}-${suffix}`;expect(xml).not.toContain(url);const html=await (await request.get(url)).text();expect(html).not.toContain('Private SEO sentinel');expect((await request.get('/og?path='+encodeURIComponent(url))).status()).toBe(404);}
  const flag=await create('/api/admin/modules/feature-flags',{flag_key:'show_apps',description:'Synthetic discovery gate',enabled:false});xml=await (await request.get('/sitemap.xml')).text();expect(xml).not.toContain('<loc>https://adamwisher.com/apps');await page.goto('/apps/'+tag);await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content',/noindex/);expect((await request.get('/og?path='+encodeURIComponent('/apps/'+tag))).status()).toBe(404);
  await create('/api/admin/modules/feature-flags',{flag_key:'show_history',description:'Synthetic history discovery',enabled:true});
  const privateApp=records.find(r=>r.url==='/api/admin/records/products'&&r.id!==app.id&&r.id)!;
  // The first fixture is Draft: publishing its related event must not expose it.
  await create('/api/admin/modules/timeline',{title:'Private related milestone sentinel',event_type:'MILESTONE',event_date:'2025-01-01',product_id:privateApp.id,status:'PUBLISHED',visibility:'PUBLIC'});
  expect((await request.get('/history')).status()).toBe(404);expect(await (await request.get('/sitemap.xml')).text()).not.toContain('<loc>https://adamwisher.com/history</loc>');
  await create('/api/admin/modules/timeline',{title:'Public related milestone',event_type:'MILESTONE',event_date:'2025-01-01',product_id:app.id,status:'PUBLISHED',visibility:'PUBLIC'});
  await page.goto('/history');await social(page,'/history');await expect(page.getByText('Private related milestone sentinel',{exact:true})).toHaveCount(0);expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://adamwisher.com/history</loc>');
  // All utility/auth/private URLs are excluded from discovery and carry HTTP noindex.
  for(const path of ['/admin/login','/admin/preview/apps/'+app.id,'/projects','/projects/login','/mail','/api/admin/records/products','/learning']){const r=await request.get(path,{maxRedirects:0});expect(r.headers()['x-robots-tag']).toContain('noindex');expect(xml).not.toContain(`<loc>${canonical(path)}</loc>`);expect((await request.get('/og?path='+encodeURIComponent(path))).status()).toBe(404);}
  expect(project.id&&seo.id&&flag.id).toBeTruthy();
 }finally{for(const r of records.reverse())expect((await page.request.delete(`${r.url}/${r.id}`,{headers})).status()).toBe(204);}
});
