import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';

async function login(page:import('@playwright/test').Page){
 await page.goto('/admin/login');await page.getByLabel('Email').fill(process.env.ADMIN_TEST_EMAIL??'admin@example.test');await page.getByLabel('Password').fill(process.env.ADMIN_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in'}).click();await expect(page).toHaveURL(/\/admin$/);
}
for(const width of [390,320])test(`learning visibility and layout at ${width}px`,async({page})=>{
 await login(page);const origin=new URL(page.url()).origin;const prefix=`Synthetic learning ${width} ${Date.now()}`;const ids:string[]=[];
 const create=async(title:string,type:string,status:string,order:number,url?:string)=>{
 const r=await page.request.post('/api/admin/modules/certifications',{headers:{Origin:origin},data:{title:`${prefix} ${title}`,issuer:'Synthetic QA provider',credential_type:type,status,visibility:'PUBLIC',sort_order:order,completion_date:'2025-06',description:('Synthetic long description for acceptance testing. ').repeat(30),...(url?{credential_url:url}:{})}});expect(r.status()).toBe(201);const body=await r.json();ids.push(body.id??body.record?.id);
 };
 try{
 await create('certification','Professional certification','PUBLISHED',0,'https://example.org/synthetic-credential');await create('course','Course','PUBLISHED',1);await create('training','Training program','PUBLISHED',2);await create('draft','Professional certification','DRAFT',3);await create('unpublished','Professional certification','DRAFT',4);
 await page.setViewportSize({width,height:900});await page.goto('/education');
 for(const name of ['certification','course','training'])await expect(page.getByRole('heading',{name:`${prefix} ${name}`,exact:true})).toBeVisible();
 for(const name of ['draft','unpublished'])await expect(page.getByText(`${prefix} ${name}`,{exact:true})).toHaveCount(0);
 const rows=page.locator('li.course-row').filter({hasText:prefix});await expect(rows).toHaveCount(3);await expect(rows.nth(0)).toContainText('Professional certification');await expect(rows.nth(1)).toContainText('Course');await expect(rows.nth(2)).toContainText('Training program');await expect(rows.nth(0)).toContainText('Synthetic long description');await expect(rows.nth(0).getByRole('link')).toHaveAttribute('href','https://example.org/synthetic-credential');await expect(rows.nth(1).getByRole('link')).toHaveCount(0);
 for(const dark of [false,true]){await page.emulateMedia({colorScheme:dark?'dark':'light'});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
 }finally{for(const id of ids)if(id)expect((await page.request.delete(`/api/admin/modules/certifications/${id}`,{headers:{Origin:origin}})).status()).toBe(204);}
});

test('absent and mismatched cutover retain static education without a database',async({browser})=>{
 for(const fingerprint of ['', 'invalid-source-fingerprint']){
 const port=3187;const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,PUBLIC_CONTENT_SOURCE:'static',PUBLIC_REDIRECTS_ENABLED:'0',PUBLIC_KNOWLEDGE_CUTOVER_SHA:fingerprint,ADMIN_DB_PATH:'/nonexistent/qa-must-not-open'},stdio:'ignore'});
 const page=await browser.newPage();try{await expect(async()=>{const r=await page.goto(`http://127.0.0.1:${port}/education`);expect(r?.status()).toBe(200);}).toPass({timeout:15000});await expect(page.getByRole('heading',{name:/A foundation in business/ })).toBeVisible();await expect(page.getByText('Generative AI for Business Leaders',{exact:true})).toBeVisible();}finally{await page.close();server.kill();await new Promise<void>(resolve=>server.once('exit',()=>resolve()));}
 }
});
