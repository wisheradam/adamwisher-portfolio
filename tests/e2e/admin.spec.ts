import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";


const password = process.env.ADMIN_TEST_PASSWORD;
if (!password) throw new Error("Set ADMIN_TEST_PASSWORD to the credential configured for the isolated test server");
const slug = () => `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
async function signIn(page:import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_TEST_EMAIL??"admin@example.test");
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("admin session, invalid login, logout and anonymous API protection",async({page,request})=>{
  const anonymous=await request.get("/api/admin/records/projects");expect(anonymous.status()).toBe(401);
  await page.goto("/admin");await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email").fill(process.env.ADMIN_TEST_EMAIL??"admin@example.test");await page.getByLabel("Password").fill("invalid-credential");await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Sign in failed");
  await signIn(page);await expect(page.getByRole("heading",{name:"Overview"})).toBeVisible();
  await page.getByRole("button",{name:"Sign out"}).click();await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/projects");await expect(page).toHaveURL(/\/admin\/login$/);
});

test("invalid and expired admin sessions cannot access content",async({page})=>{
  await page.context().addCookies([{name:"adam_admin_session",value:"invalid",domain:"127.0.0.1",path:"/"}]);
  await page.goto("/admin/projects");await expect(page).toHaveURL(/\/admin\/login$/);
  const denied=await page.request.get("/api/admin/records/projects");expect(denied.status()).toBe(401);
  await page.context().addCookies([{name:"adam_admin_session",value:"0".repeat(64),domain:"127.0.0.1",path:"/"}]);
  await page.goto("/admin/projects");await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await page.request.get("/api/admin/records/projects")).status()).toBe(401);
  await signIn(page);
  await page.context().clearCookies();
  await page.goto("/admin/preview/nonexistent");await expect(page).toHaveURL(/\/admin\/login$/);
});

test("admin search and pagination remain usable with growing records",async({page})=>{
  await signIn(page);const prefix=slug();const origin=new URL(page.url()).origin;
  for(let n=0;n<26;n++) {
    const response=await page.request.post("/api/admin/records/products",{headers:{Origin:origin},data:{slug:`${prefix}-${n}`,title:`Pagination ${prefix} ${n}`,type:"WEB_APP",status:"CONCEPT"}});
    expect(response.status()).toBe(201);
  }
  await page.goto("/admin/apps");await page.getByLabel("Search").fill(prefix);
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await page.getByRole("button",{name:"Next"}).click();await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button",{name:"Previous"}).click();await expect(page.locator("tbody tr")).toHaveCount(25);
});

test("project draft, edit, preview, publish, search, unpublish and soft delete",async({page,request})=>{
  const projectSlug=slug();await signIn(page);await page.goto("/admin/projects");
  await page.getByRole("button",{name:"New project"}).click();
  const form=page.locator("form.admin-editor");await form.getByLabel("Title").fill("QA Project");await form.getByLabel("Slug").fill(projectSlug);
  await form.getByLabel("Summary").fill("Initial summary");await form.getByLabel("Full description").fill("Initial body");
  await form.getByLabel("Visibility").selectOption("PUBLIC");await form.getByRole("button",{name:"Save draft"}).click();
  await expect(page.getByRole("cell",{name:/QA Project/})).toBeVisible();
  expect((await request.get(`/work/${projectSlug}`)).status()).toBe(404);
  await page.getByLabel("Search").fill(projectSlug);
  await page.getByRole("button",{name:"Edit"}).click();await expect(form.getByLabel("Full description")).toHaveValue("Initial body");
  await form.getByLabel("Summary").fill("Edited summary");await form.getByRole("button",{name:"Save draft"}).click();
  await page.getByRole("link",{name:"Preview"}).click();await expect(page.getByText("Edited summary")).toBeVisible();
  await page.goBack();await page.getByLabel("Search").fill(projectSlug);await page.getByRole("button",{name:"Edit"}).click();
  page.once("dialog",dialog=>dialog.accept());await form.getByLabel("Status").selectOption("PUBLISHED");await form.getByRole("button",{name:"Publish"}).click();
  await expect(page.getByRole("cell",{name:"PUBLISHED"})).toBeVisible();
  const publicPage=await request.get(`/work/${projectSlug}`);expect(publicPage.status()).toBe(200);expect(await publicPage.text()).toContain("Edited summary");
  await page.getByRole("button",{name:"Edit"}).click();await form.getByLabel("Status").selectOption("DRAFT");await form.getByRole("button",{name:"Save draft"}).click();
  expect((await request.get(`/work/${projectSlug}`)).status()).toBe(404);
  const rows=await page.request.get("/api/admin/records/projects?q="+projectSlug);const record=(await rows.json()).records[0];
  expect((await page.request.delete(`/api/admin/records/projects/${record.id}`,{headers:{Origin:new URL(page.url()).origin}})).status()).toBe(204);
});

test("admin API validates input, duplicate slugs, CSRF and missing records",async({page,request})=>{
  await signIn(page);const name=slug();const origin=new URL(page.url()).origin;
  const post=(data:unknown,headers:Record<string,string>={Origin:origin})=>page.request.post("/api/admin/records/projects",{data,headers});
  expect((await post({slug:"Bad Slug",title:"Invalid"})).status()).toBe(400);
  expect((await post({slug:name,title:"One",status:"DRAFT"})).status()).toBe(201);
  const duplicate=await post({slug:name,title:"Two",status:"DRAFT"});expect(duplicate.status()).toBe(500);
  expect((await page.request.get("/api/admin/records/projects/nonexistent")).status()).toBe(404);
  expect((await request.get("/admin/preview/nonexistent",{maxRedirects:0})).status()).toBe(307);
  expect((await page.request.post("/api/admin/records/projects",{data:{slug:slug(),title:"CSRF"},headers:{Origin:"https://attacker.example"}})).status()).toBe(403);
});

test("apps and tools creation, editing and search remain private",async({page,request})=>{
  const name=slug();await signIn(page);await page.goto("/admin/apps");await page.getByRole("button",{name:"New app"}).click();
  const form=page.locator("form.admin-editor");await form.getByLabel("Title").fill("QA App");await form.getByLabel("Slug").fill(name);
  await form.getByLabel("Type").selectOption("AI_TOOL");await form.getByRole("button",{name:"Save draft"}).click();
  await page.getByLabel("Search").fill(name);await expect(page.getByRole("cell",{name:/QA App/})).toBeVisible();
  await page.getByRole("button",{name:"Edit"}).click();await form.getByLabel("Summary").fill("Updated app");await form.getByRole("button",{name:"Save draft"}).click();
  expect((await request.get(`/apps/${name}`)).status()).toBe(404);
});

for(const width of [1440,1280,768,390,320]) {
  test(`admin responsive navigation and form at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});await signIn(page);await page.goto("/admin/projects");
    await expect(page.getByRole("navigation",{name:"Admin navigation"})).toBeVisible();
    await page.getByRole("button",{name:"New project"}).click();await expect(page.getByLabel("Slug")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.keyboard.press("Tab");expect(await page.evaluate(()=>getComputedStyle(document.activeElement!).outlineStyle)).not.toBe("none");
    if(width===1440||width===390) {
      const a11y=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
      expect(a11y.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)}))).toEqual([]);
    }
  });
}

test("Super Admin manages roles; Editor and Read Only API restrictions persist",async({page,browser})=>{
  await signIn(page);const origin=new URL(page.url()).origin,tag=slug();
  const provision=async(role:string)=>{const email=`${role.toLowerCase()}-${tag}@example.test`,pass=`Temporary-${tag}-Secret`;const r=await page.request.post("/api/admin/users",{headers:{Origin:origin},data:{email,password:pass,role}});expect(r.status()).toBe(201);return {...await r.json(),pass};};
  const editor=await provision("EDITOR"),reader=await provision("READ_ONLY");
  await page.goto("/admin/users");await expect(page.getByRole("heading",{name:"Users"})).toBeVisible();await expect(page.getByText(editor.email)).toBeVisible();
  const editorContext=await browser.newContext(),editorPage=await editorContext.newPage();await editorPage.goto("/admin/login");await editorPage.getByLabel("Email").fill(editor.email);await editorPage.getByLabel("Password").fill(editor.pass);await editorPage.getByRole("button",{name:"Sign in"}).click();await expect(editorPage).toHaveURL(/\/admin$/);
  await editorPage.goto("/admin/projects");await expect(editorPage.getByRole("button",{name:"New project"})).toBeVisible();
  expect((await editorPage.request.get("/api/admin/users")).status()).toBe(403);
  const draft=await editorPage.request.post("/api/admin/records/projects",{headers:{Origin:origin},data:{slug:`editor-${tag}`,title:"Editor draft",status:"DRAFT"}});expect(draft.status()).toBe(201);const project=await draft.json();
  expect((await editorPage.request.patch(`/api/admin/records/projects/${project.id}`,{headers:{Origin:origin},data:{status:"PUBLISHED"}})).status()).toBe(403);
  const readerContext=await browser.newContext(),readerPage=await readerContext.newPage();await readerPage.goto("/admin/login");await readerPage.getByLabel("Email").fill(reader.email);await readerPage.getByLabel("Password").fill(reader.pass);await readerPage.getByRole("button",{name:"Sign in"}).click();await expect(readerPage).toHaveURL(/\/admin$/);
  await readerPage.goto("/admin/projects");await expect(readerPage.getByRole("button",{name:"New project"})).toHaveCount(0);
  expect((await readerPage.request.post("/api/admin/records/projects",{headers:{Origin:origin},data:{slug:`reader-${tag}`,title:"Denied"}})).status()).toBe(403);
  expect((await readerPage.goto(`/admin/preview/${project.id}`))?.status()).toBe(404);
  await page.request.patch(`/api/admin/users/${editor.id}`,{headers:{Origin:origin},data:{role:"READ_ONLY",active:true}});
  expect((await editorPage.request.get("/api/admin/records/projects")).status()).toBe(401);
  await editorContext.close();await readerContext.close();
});

test("Apps Draft, Preview, Publish and Unpublish are server enforced",async({page,request})=>{
  await signIn(page);const appSlug=slug();await page.goto("/admin/apps");await page.getByRole("button",{name:"New app"}).click();const form=page.locator("form.admin-editor");
  await form.getByLabel("Title").fill("Stage Five App");await form.getByLabel("Slug").fill(appSlug);await form.getByLabel("Type").selectOption("WEB_APP");await form.getByLabel("Visibility").selectOption("PUBLIC");await form.getByRole("button",{name:"Save draft"}).click();
  expect((await request.get(`/apps/${appSlug}`)).status()).toBe(404);
  await page.getByLabel("Search").fill(appSlug);await page.getByRole("link",{name:"Preview"}).click();await expect(page.getByRole("heading",{name:"Stage Five App"})).toBeVisible();
  await page.goBack();await page.getByLabel("Search").fill(appSlug);await page.getByRole("button",{name:"Edit"}).click();
  page.once("dialog",dialog=>dialog.accept());await form.getByLabel("Status").selectOption("PUBLISHED");await form.getByRole("button",{name:"Publish"}).click();
  expect((await request.get(`/apps/${appSlug}`)).status()).toBe(200);
  await page.getByRole("button",{name:"Edit"}).click();await form.getByLabel("Status").selectOption("DRAFT");await form.getByRole("button",{name:"Save draft"}).click();
  expect((await request.get(`/apps/${appSlug}`)).status()).toBe(404);
});

test("login limits repeated failures without revealing account existence",async({request})=>{
  const email=`unknown-${slug()}@example.test`,base="http://127.0.0.1:3100";
  for(let n=0;n<5;n++)expect((await request.post("/api/admin/login",{headers:{Origin:base},data:{email,password:"incorrect"}})).status()).toBe(401);
  expect((await request.post("/api/admin/login",{headers:{Origin:base},data:{email,password:"incorrect"}})).status()).toBe(429);
});
