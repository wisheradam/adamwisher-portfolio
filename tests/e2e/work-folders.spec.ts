import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function login(page:Page){await page.goto('/admin/login');await page.getByLabel('Email').fill(process.env.ADMIN_TEST_EMAIL??'admin@example.test');await page.getByLabel('Password').fill(process.env.ADMIN_TEST_PASSWORD!);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/admin$/);}
const selected=(page:Page)=>page.locator('#selected-work');
for(const width of [1440,1280,768,390,320])test(`work folders: layout, touch targets and themes at ${width}px`,async({page},testInfo)=>{
 await page.setViewportSize({width,height:900});await page.goto('/work');const section=page.locator('section[aria-labelledby="work-heading"]');await section.scrollIntoViewIfNeeded();await expect(section.locator('.gf-root')).toHaveCount(6);
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
  const a11y=await new AxeBuilder({page}).include('section[aria-labelledby="work-heading"]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(a11y.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)}))).toEqual([]);
  if([1440,390,320].includes(width))await section.screenshot({path:testInfo.outputPath(`admin-work-folders-${width}-${theme}.png`),animations:'disabled'});
 }
 await page.keyboard.press('Escape');await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-expanded','false');await expect(folder.locator('.gf-files')).toHaveAttribute('inert','');
});

test('work folders: keyboard navigation, real materials, reduced motion and no public writes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const writes:string[]=[];page.on('request',r=>{if(['POST','PATCH','PUT','DELETE'].includes(r.method()))writes.push(r.url());});
 await page.goto('/work');const section=page.locator('section[aria-labelledby="work-heading"]'),folder=section.locator('.gf-root').first(),button=folder.getByRole('button');await button.focus();await page.keyboard.press('Space');await expect(button).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Tab');await expect(folder.getByRole('link',{name:'Case study: Single Source of Truth',exact:true})).toBeFocused();
 expect(await folder.locator('.gf-front').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
 await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/work\/single-source-of-truth$/);await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await page.goto('/work');const first=page.locator('section[aria-labelledby="work-heading"]').locator('.gf-root').first();await first.getByRole('button').click();const cover=first.getByRole('link',{name:'Cover diagram: Single Source of Truth',exact:true});const href=await cover.getAttribute('href');expect(href).toBe('/project-visuals/ssot-light.svg');expect((await page.request.get(href!)).status()).toBe(200);
 // A document's exposed header is the pointer target in the supplied stacked geometry.
 await cover.click({position:{x:130,y:24}});await expect(page).toHaveURL(/\/project-visuals\/ssot-light\.svg$/);expect(writes).toEqual([]);
});

test('work folders: mobile tap opens and closes materials',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();try{
 await page.goto('/work');const folder=page.locator('section[aria-labelledby="work-heading"]').locator('.gf-root').first(),button=folder.getByRole('button');await button.tap();await expect(button).toHaveAttribute('aria-expanded','true');
 await folder.getByRole('link',{name:'Cover diagram: Single Source of Truth',exact:true}).tap({position:{x:130,y:24}});await expect(page).toHaveURL(/\/project-visuals\/ssot-light\.svg$/);
 await page.goto('/work');await page.locator('section[aria-labelledby="work-heading"]').locator('.gf-root').first().getByRole('button').tap();await page.getByRole('heading',{name:'Work',exact:true}).tap();await expect(page.locator('section[aria-labelledby="work-heading"]').locator('.gf-root').first().getByRole('button')).toHaveAttribute('aria-expanded','false');
 }finally{await context.close();}
});
