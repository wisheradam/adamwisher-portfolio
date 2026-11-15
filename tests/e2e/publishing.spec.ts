import {test,expect,type Page} from '@playwright/test';
import {spawn} from 'node:child_process';
async function login(page:Page){await page.goto('/admin/login');await page.getByLabel('Email').fill(process.env.ADMIN_TEST_EMAIL??'admin@example.test');await page.getByLabel('Password').fill(process.env.ADMIN_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in'}).click();await expect(page).toHaveURL(/\/admin$/);}
const cases=[
 {module:'certifications',table:'certifications',label:'Title',route:'/education',extra:{'Issuer / provider':'Synthetic QA','Credential type':'Professional certification','Credential URL':'https://example.org/synthetic-credential','Completion date':'2025-06'}},
 {module:'experience',table:'experience',label:'Title',route:'/about',extra:{Company:'Synthetic QA'}},
 {module:'education',table:'education_records',label:'Program',route:'/education',extra:{Institution:'Synthetic QA'}},
 {module:'apps',table:'products',label:'Title',route:'',extra:{}},
 {module:'releases',table:'releases',label:'Release title',route:'',extra:{Version:'1.0.0','Release date':'2025-06-01'}},
 {module:'timeline',table:'timeline_events',label:'Title',route:'/history',extra:{Date:'2025-06-01'}},
];
for(const c of cases)test(`${c.module}: UI publication lifecycle isolates working revisions`,async({page,browser},testInfo)=>{
 await login(page);const origin=new URL(page.url()).origin,tag=`synthetic-${c.module}-${Date.now()}`,v1=`${tag} approved v1`,v2=`${tag} pending v2`;let id='';let parentId='';let flagId='';
 const api=c.module==='apps'?'/api/admin/records/products':`/api/admin/modules/${c.module}`;
 const publicPage=await browser.newPage();let publicRoute=c.route;
 const setup=async(url:string,data:unknown)=>{const r=await page.request.post(url,{headers:{Origin:origin},data});expect(r.status()).toBe(201);return (await r.json()).id as string;};
 try{
  if(c.module==='timeline')flagId=await setup('/api/admin/modules/feature-flags',{flag_key:'show_history',description:'Synthetic QA history',enabled:true});
  if(c.module==='releases'){parentId=await setup('/api/admin/records/products',{slug:tag,title:'Synthetic parent app',type:'WEB_APP',status:'PUBLISHED',visibility:'PUBLIC'});publicRoute=`/apps/${tag}/changelog`;}
  if(c.module==='apps')publicRoute=`/apps/${tag}`;
  await page.goto(`/admin/${c.module}`);await page.getByRole('button',{name:c.module==='apps'?'New app':'New record',exact:true}).click();const form=page.locator('form.admin-editor');
  await form.getByLabel(c.label,{exact:true}).fill(v1);
  for(const [label,value] of Object.entries(c.extra))await form.getByLabel(label,{exact:true}).fill(value);
  if(c.module==='apps')await form.getByLabel('Slug',{exact:true}).fill(tag);
  if(c.module==='timeline')await form.getByLabel('Event type',{exact:true}).selectOption('MILESTONE');
  if(parentId)await form.getByLabel('App ID',{exact:true}).fill(parentId);
  await form.getByLabel('Visibility',{exact:true}).selectOption('PUBLIC');
  const description=c.module==='apps'?'Summary':c.module==='releases'?'Release notes':'Description';
  await form.getByLabel(description,{exact:true}).fill('Clearly synthetic isolated acceptance fixture.');
  const created=page.waitForResponse(r=>r.url().endsWith(api)&&r.request().method()==='POST');
  await form.getByRole('button',{name:'Save draft',exact:true}).click();const response=await created;expect(response.status()).toBe(201);id=(await response.json()).id;
  await expect(form).toHaveCount(0);await page.getByLabel(c.module==='apps'?'Search':`Search ${c.module==='certifications'?'Certifications & Courses':c.module==='education'?'Education':c.module==='experience'?'Experience':c.module==='releases'?'Releases':'Timeline'}`,{exact:true}).fill(tag);
  const row=page.locator('tbody tr').filter({hasText:tag});await expect(row).toHaveCount(1);await expect(row).toContainText('Unpublished');
  const check=async(visible:string|null,hidden:string)=>{await publicPage.goto(publicRoute);if(visible)await expect(publicPage.getByRole('heading',{name:visible,exact:c.module!=='releases'})).toBeVisible();await expect(publicPage.getByText(hidden,{exact:true})).toHaveCount(0);const http=await publicPage.request.get(publicRoute);expect(await http.text()).not.toContain(hidden);};
  await check(null,v1);
  await row.getByRole('button',{name:'Publish',exact:true}).click();await expect(row).toContainText('Published');await check(v1,v2);
  await row.getByRole('button',{name:'Edit',exact:true}).click();await form.getByLabel(c.label,{exact:true}).fill(v2);await check(v1,v2);
  await form.getByRole('button',{name:'Save draft',exact:true}).click();await expect(form).toHaveCount(0);await expect(row).toContainText('Published with unpublished changes');await check(v1,v2);
  if(c.module==='certifications'){
   const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3191'],{env:{...process.env,PUBLIC_CONTENT_SOURCE:'static',PUBLIC_REDIRECTS_ENABLED:'0',PUBLIC_KNOWLEDGE_CUTOVER_SHA:''},stdio:'ignore'});
   const fallback=await browser.newPage();try{await expect(async()=>{const r=await fallback.goto('http://127.0.0.1:3191/education');expect(r?.status()).toBe(200);}).toPass({timeout:15000});await expect(fallback.getByText('Generative AI for Business Leaders',{exact:true})).toBeVisible();await expect(fallback.getByText(v1,{exact:true})).toHaveCount(0);await expect(fallback.getByText(v2,{exact:true})).toHaveCount(0);}finally{await fallback.close();if(server.exitCode===null){server.kill();await new Promise<void>(resolve=>server.once('exit',()=>resolve()));}}
  }
  await page.reload();await row.getByRole('button',{name:'Edit',exact:true}).click();await expect(form.getByLabel(c.label,{exact:true})).toHaveValue(v2);await form.getByRole('button',{name:'Cancel',exact:true}).click();
  await row.getByRole('button',{name:'Publish',exact:true}).click();await expect(row).not.toContainText('unpublished changes');await check(v2,v1);
  // A real transition from visible published content through Admin Unpublish.
  await row.getByRole('button',{name:'Unpublish',exact:true}).click();await expect(row).toContainText('Unpublished');await check(null,v2);
  await row.getByRole('button',{name:'Republish',exact:true}).click();await expect(row).toContainText('Published');await check(v2,v1);
  if(c.module==='certifications')for(const width of [390,320]){await publicPage.setViewportSize({width,height:900});for(const theme of ['light','dark']){await publicPage.evaluate(t=>localStorage.setItem('adam-theme',t),theme);await publicPage.reload();await expect(publicPage.getByRole('heading',{name:v2,exact:true})).toBeVisible();expect(await publicPage.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);await expect(publicPage.locator('li.course-row').filter({hasText:v2}).getByRole('link')).toHaveAttribute('href','https://example.org/synthetic-credential');await publicPage.screenshot({path:testInfo.outputPath(`admin-certification-${width}-${theme}.png`),fullPage:true});}}
  await page.goto('/admin/audit-log');const audit=page.locator('tbody tr').filter({hasText:id});for(const action of ['DRAFT_SAVED','PUBLISHED','PUBLICATION_UPDATED','UNPUBLISHED','REPUBLISHED'])await expect(audit.getByRole('cell',{name:action,exact:true}).first()).toBeVisible();
 }finally{
  if(id)expect((await page.request.delete(`${api}/${id}`,{headers:{Origin:origin}})).status()).toBe(204);
  if(parentId)expect((await page.request.delete(`/api/admin/records/products/${parentId}`,{headers:{Origin:origin}})).status()).toBe(204);
  if(flagId)expect((await page.request.delete(`/api/admin/modules/feature-flags/${flagId}`,{headers:{Origin:origin}})).status()).toBe(204);
  if(id){const html=await (await publicPage.request.get(publicRoute)).text();expect(html).not.toContain(v1);expect(html).not.toContain(v2);}
  await publicPage.close();
 }
});

test('publishing RBAC, rejected requests and session loss preserve public content',async({page,browser})=>{
 await login(page);const origin=new URL(page.url()).origin,tag=`synthetic-rbac-${Date.now()}`;const accounts:{id:string;email:string;password:string}[]=[];let id='';
 const editorContext=await browser.newContext(),readerContext=await browser.newContext();
 try{
  for(const role of ['EDITOR','READ_ONLY']){const password=`Synthetic-${tag}-${role}`,email=`${role.toLowerCase()}-${tag}@example.test`;const made=await page.request.post('/api/admin/users',{headers:{Origin:origin},data:{email,password,role}});expect(made.status()).toBe(201);accounts.push({...await made.json(),password});}
  const made=await page.request.post('/api/admin/modules/certifications',{headers:{Origin:origin},data:{title:tag,issuer:'Synthetic QA',status:'PUBLISHED',visibility:'PUBLIC'}});expect(made.status()).toBe(201);id=(await made.json()).id;
  const editor=await editorContext.newPage(),reader=await readerContext.newPage();
  for(const [p,a] of [[editor,accounts[0]],[reader,accounts[1]]] as const){await p.goto('/admin/login');await p.getByLabel('Email').fill(a.email);await p.getByLabel('Password').fill(a.password);await p.getByRole('button',{name:'Sign in'}).click();await expect(p).toHaveURL(/\/admin$/);await p.goto('/admin/certifications');await p.getByLabel('Search Certifications & Courses').fill(tag);await expect(p.locator('tbody tr').filter({hasText:tag})).toHaveCount(1);await expect(p.getByRole('button',{name:'Publish',exact:true})).toHaveCount(0);await expect(p.getByRole('button',{name:'Unpublish',exact:true})).toHaveCount(0);}
  await expect(reader.getByRole('button',{name:'Edit',exact:true})).toHaveCount(0);
  for(const p of [editor,reader])for(const status of ['PUBLISHED','ARCHIVED'])expect((await p.request.patch(`/api/admin/modules/certifications/${id}`,{headers:{Origin:origin},data:{status}})).status()).toBe(403);
  expect((await reader.request.patch(`/api/admin/modules/certifications/${id}`,{headers:{Origin:origin},data:{title:'Denied draft',status:'DRAFT'}})).status()).toBe(403);
  await editor.locator('tbody tr').filter({hasText:tag}).getByRole('button',{name:'Edit',exact:true}).click();const form=editor.locator('form.admin-editor');await form.getByLabel('Title',{exact:true}).fill(tag+' private draft');await form.getByRole('button',{name:'Save draft',exact:true}).click();await expect(form).toHaveCount(0);await expect(editor.locator('tbody tr').filter({hasText:tag})).toContainText('Published with unpublished changes');
  const publicPage=await browser.newPage();await publicPage.goto('/education');await expect(publicPage.getByRole('heading',{name:tag,exact:true})).toBeVisible();await expect(publicPage.getByText(tag+' private draft',{exact:true})).toHaveCount(0);expect(await (await publicPage.request.get('/education')).text()).not.toContain(tag+' private draft');
  // Revoke the active editor session while its form is open.
  await editor.getByRole('button',{name:'Edit',exact:true}).click();await form.getByLabel('Title',{exact:true}).fill(tag+' lost session');
  expect((await page.request.patch(`/api/admin/users/${accounts[0].id}`,{headers:{Origin:origin},data:{role:'EDITOR',active:false}})).status()).toBe(200);
  await form.getByRole('button',{name:'Save draft',exact:true}).click();await expect(form.getByRole('alert')).toBeVisible();
  const saved=await (await page.request.get(`/api/admin/modules/certifications/${id}`)).json();expect(saved.title).toBe(tag+' private draft');
  await publicPage.reload();await expect(publicPage.getByRole('heading',{name:tag,exact:true})).toBeVisible();await publicPage.close();
 }finally{
  if(id)expect((await page.request.delete(`/api/admin/modules/certifications/${id}`,{headers:{Origin:origin}})).status()).toBe(204);
  for(const a of accounts)expect((await page.request.patch(`/api/admin/users/${a.id}`,{headers:{Origin:origin},data:{role:'READ_ONLY',active:false}})).status()).toBe(200);
  await editorContext.close();await readerContext.close();
 }
});
