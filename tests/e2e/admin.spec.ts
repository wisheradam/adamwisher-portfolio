import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const password = process.env.ADMIN_TEST_PASSWORD;
if (!password) throw new Error("Set ADMIN_TEST_PASSWORD to the credential configured for the isolated test server");
const slug = () => `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
async function signIn(page:import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("admin session, invalid login, logout and anonymous API protection",async({page,request})=>{
  const anonymous=await request.get("/api/admin/records/projects");expect(anonymous.status()).toBe(401);
  await page.goto("/admin");await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Password").fill("invalid-credential");await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page.getByRole("alert")).toContainText("Sign in failed");
  await signIn(page);await expect(page.getByRole("heading",{name:"Overview"})).toBeVisible();
  await page.getByRole("button",{name:"Sign out"}).click();await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/projects");await expect(page).toHaveURL(/\/admin\/login$/);
});

test("invalid and expired admin sessions cannot access content",async({page})=>{
  await page.context().addCookies([{name:"adam_admin_session",value:"invalid",domain:"127.0.0.1",path:"/"}]);
  await page.goto("/admin/projects");await expect(page).toHaveURL(/\/admin\/login$/);
  const denied=await page.request.get("/api/admin/records/projects");expect(denied.status()).toBe(401);
  await signIn(page);
  await page.context().clearCookies();
  await page.goto("/admin/preview/nonexistent");await expect(page).toHaveURL(/\/admin\/login$/);
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
