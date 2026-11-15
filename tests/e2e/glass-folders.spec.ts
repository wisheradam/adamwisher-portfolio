import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function login(page:Page){await page.goto('/admin/login');await page.getByLabel('Email').fill(process.env.ADMIN_TEST_EMAIL??'admin@example.test');await page.getByLabel('Password').fill(process.env.ADMIN_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/admin$/);}
const selected=(page:Page)=>page.locator('#selected-work');
for(const width of [1440,1280,768,390,320])test(`glass folders: layout, touch targets and themes at ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await page.goto('/');const section=selected(page);await section.scrollIntoViewIfNeeded();await expect(section.locator('.gf-root')).toHaveCount(6);
 await expect(section.getByRole('heading',{level:3})).toHaveCount(6);await expect(section.locator('input,[role="menu"],.gf-key')).toHaveCount(0);
 const folder=section.locator('.gf-root').first(),button=folder.getByRole('button');await button.click();await expect(button).toHaveAttribute('aria-expanded','true');await expect(folder.locator('.gf-files')).not.toHaveAttribute('inert','');
 await expect(folder.getByRole('link',{name:'Case study: Single Source of Truth',exact:true})).toBeVisible();
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>{localStorage.setItem('adam-theme',theme);document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.classList.toggle('light',theme==='light');},theme);
  for(const cover of await section.locator(`.gf-cover-${theme}`).all()){await cover.scrollIntoViewIfNeeded();await expect.poll(()=>cover.evaluate(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0)).toBe(true);}
  await expect(section.locator('.gf-root:not([data-entered])')).toHaveCount(0);
  await button.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const target=await button.boundingBox();expect(target!.width).toBeGreaterThanOrEqual(44);expect(target!.height).toBeGreaterThanOrEqual(44);
  const a11y=await new AxeBuilder({page}).include('#selected-work').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(a11y.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)}))).toEqual([]);
  if([1440,390,320].includes(width))await section.screenshot({path:testInfo.outputPath(`admin-glass-folders-${width}-${theme}.png`),animations:'disabled'});
 }
 await page.keyboard.press('Escape');await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-expanded','false');await expect(folder.locator('.gf-files')).toHaveAttribute('inert','');
});

test('glass folders: keyboard navigation, real materials, reduced motion and no public writes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const writes:string[]=[];page.on('request',r=>{if(['POST','PATCH','PUT','DELETE'].includes(r.method()))writes.push(r.url());});
 await page.goto('/');const section=selected(page),folder=section.locator('.gf-root').first(),button=folder.getByRole('button');await button.focus();await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Tab');await expect(folder.getByRole('link',{name:'Case study: Single Source of Truth',exact:true})).toBeFocused();
 expect(await folder.locator('.gf-front').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/work\/single-source-of-truth$/);await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await page.goto('/');const first=selected(page).locator('.gf-root').first();await first.getByRole('button').click();const cover=first.getByRole('link',{name:'Cover diagram: Single Source of Truth',exact:true});const href=await cover.getAttribute('href');expect(href).toBe('/project-visuals/ssot-light.svg');expect((await page.request.get(href!)).status()).toBe(200);
 // A document's exposed header is the pointer target in the supplied stacked geometry.
 await cover.click({position:{x:130,y:24}});await expect(page).toHaveURL(/\/project-visuals\/ssot-light\.svg$/);expect(writes).toEqual([]);
});

test('glass folders: mobile tap opens and closes materials',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();try{
 await page.goto('/');const folder=selected(page).locator('.gf-root').first(),button=folder.getByRole('button');await button.tap();await expect(button).toHaveAttribute('aria-expanded','true');
 await folder.getByRole('link',{name:'Cover diagram: Single Source of Truth',exact:true}).tap({position:{x:130,y:24}});await expect(page).toHaveURL(/\/project-visuals\/ssot-light\.svg$/);
 await page.goto('/');await selected(page).locator('.gf-root').first().getByRole('button').tap();await page.getByRole('heading',{name:'Selected work',exact:true}).tap();await expect(selected(page).locator('.gf-root').first().getByRole('button')).toHaveAttribute('aria-expanded','false');
 }finally{await context.close();}
});

test('glass folders: managed publication is server-filtered, protected materials never leak',async({page,browser})=>{
 page.setDefaultTimeout(10000);await login(page);const tag=`folder-qa-${Date.now()}`,origin=new URL(page.url()).origin,headers={Origin:origin};const ids:string[]=[];const anonymous=await browser.newPage();
 try{
  for(const [suffix,status,visibility] of [['draft','DRAFT','PUBLIC'],['private','PUBLISHED','PRIVATE'],['archived','ARCHIVED','PUBLIC']] as const){const r=await page.request.post('/api/admin/records/projects',{headers,data:{slug:`${tag}-${suffix}`,title:`${tag}-${suffix}`,status,visibility,body:'PASSWORD_PROTECTED_MATERIAL /projects/product-checker'}});expect(r.status()).toBe(201);ids.push((await r.json()).id);}
  await page.goto('/admin/projects');await page.getByRole('button',{name:'New project',exact:true}).click();const form=page.locator('form.admin-editor');await form.getByLabel('Title',{exact:true}).fill(`${tag}-public`);await form.getByLabel('Slug').fill(`${tag}-public`);await form.getByLabel('Summary').fill('Synthetic public portfolio summary');await form.getByLabel('Full description').fill('BODY_MATERIAL_SENTINEL /projects/private /api/admin/media/private');await form.getByLabel('Visibility').selectOption('PUBLIC');
  const create=page.waitForResponse(r=>r.url().endsWith('/api/admin/records/projects')&&r.request().method()==='POST');await form.getByRole('button',{name:'Save draft',exact:true}).click();const made=await create;expect(made.status()).toBe(201);const id=(await made.json()).id;ids.push(id);await expect(form).toHaveCount(0);
  const check=async(visible:boolean)=>{await anonymous.goto('/');const section=selected(anonymous);await expect(section.getByRole('heading',{name:`${tag}-public`,exact:true})).toHaveCount(visible?1:0);const html=await (await anonymous.request.get('/')).text();for(const suffix of ['draft','private','archived'])expect(html).not.toContain(`${tag}-${suffix}`);for(const marker of ['PASSWORD_PROTECTED_MATERIAL','BODY_MATERIAL_SENTINEL','/api/admin/media/private','/projects/private'])expect(html).not.toContain(marker);};
  await check(false);await page.getByLabel('Search',{exact:true}).fill(tag+'-public');const row=page.locator('tbody tr').filter({hasText:tag+'-public'});await expect(row).toHaveCount(1);await row.getByRole('button',{name:'Edit',exact:true}).click();await form.getByLabel('Status').selectOption('PUBLISHED');page.once('dialog',dialog=>dialog.accept());await form.getByRole('button',{name:'Publish',exact:true}).click();await expect(form).toHaveCount(0);await check(true);
  const card=selected(anonymous).locator('.project-folder-card').filter({hasText:tag+'-public'});await card.getByRole('button').click();await expect(card.getByRole('link',{name:`Project overview: ${tag}-public`,exact:true})).toHaveAttribute('href',`/og?path=%2Fwork%2F${tag}-public`);expect((await anonymous.request.get(`/og?path=%2Fwork%2F${tag}-public`)).status()).toBe(200);
  // Projects preserve their pre-existing legacy workflow: Draft/Archive removes public eligibility.
  await row.getByRole('button',{name:'Edit',exact:true}).click();await form.getByLabel('Status').selectOption('DRAFT');await form.getByRole('button',{name:'Save draft',exact:true}).click();await expect(form).toHaveCount(0);await check(false);
  expect((await anonymous.request.post('/api/admin/records/projects',{headers,data:{title:'Forbidden',slug:'forbidden'}})).status()).toBe(401);
 }finally{for(const id of ids)expect((await page.request.delete(`/api/admin/records/projects/${id}`,{headers})).status()).toBe(204);await anonymous.close();}
});
