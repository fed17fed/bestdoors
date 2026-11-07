import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { pageInputSchema } from "@bestdoors/shared";
import { createApp } from "../src/app";
import { cleanHtml } from "../src/lib/sanitize-html";

const app = createApp();
const admin = request.agent(app);

beforeAll(async () => {
  await admin
    .post("/api/v1/auth/login")
    .send({ email: process.env.ADMIN_EMAIL ?? "admin@bestdoors.ie", password: process.env.ADMIN_PASSWORD })
    .expect(200);
});

const body = (over: Record<string, unknown> = {}) => ({
  slug: "test-page",
  title: "Test page",
  content: "<h2>Hello</h2><p>Text</p>",
  seoTitle: "",
  seoDescription: "",
  status: "PUBLISHED",
  showInFooter: false,
  sortOrder: 5,
  ...over,
});

describe("HTML cleaning (XSS)", () => {
  it("removes script, iframe, event attributes and javascript: links", () => {
    const dirty = [
      '<p onclick="alert(1)">Hi <b onmouseover="x()">there</b></p>',
      "<script>alert(1)</script>",
      '<iframe src="https://evil.example"></iframe>',
      '<a href="javascript:alert(1)">bad link</a>',
      '<a href="JaVaScRiPt:alert(1)">bad link 2</a>',
      '<img src="x" onerror="alert(1)">',
      '<img src="data:image/svg+xml;base64,AAAA">',
      '<style>body{display:none}</style>',
      '<form action="https://evil.example"><input name="a"></form>',
      '<svg onload="alert(1)"></svg>',
      '<div style="background:url(javascript:alert(1))">x</div>',
    ].join("");
    const clean = cleanHtml(dirty);
    for (const bad of ["<script", "alert(1)", "<iframe", "javascript:", "onerror", "onclick", "onmouseover", "onload", "<style", "<form", "<input", "<svg", "data:", "display:none"]) {
      expect(clean.toLowerCase(), bad).not.toContain(bad.toLowerCase());
    }
    expect(clean).toContain("<b>there</b>");
  });

  it("keeps normal formatting, safe links, images and tables", () => {
    const good =
      '<h2>Title</h2><p style="text-align: center">Some <strong>bold</strong> and <em>italic</em></p><ul><li><p>One</p></li></ul>' +
      '<a href="https://example.com" target="_blank">link</a><img src="https://example.com/a.jpg" alt="Door">' +
      '<table><tbody><tr><th>A</th></tr><tr><td colspan="2">B</td></tr></tbody></table>';
    const clean = cleanHtml(good);
    expect(clean).toContain("<h2>Title</h2>");
    expect(clean).toContain("<strong>bold</strong>");
    expect(clean).toContain('text-align:center');
    expect(clean).toContain('href="https://example.com"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).toContain('src="https://example.com/a.jpg"');
    expect(clean).toContain("<table>");
    expect(clean).toContain('colspan="2"');
  });

  it("turns <h1> into <h2> (the page title is the only h1)", () => {
    expect(cleanHtml("<h1>Big</h1>")).toBe("<h2>Big</h2>");
  });
});

describe("page input rules", () => {
  it("checks the slug format and reserved addresses", () => {
    expect(pageInputSchema.safeParse(body()).success).toBe(true);
    for (const slug of ["Bad Slug", "UPPER", "-start", "end-", "a_b", "x", "two--dashes", "doors", "admin", "api", "cart"]) {
      expect(pageInputSchema.safeParse(body({ slug })).success, slug).toBe(false);
    }
    expect(pageInputSchema.safeParse(body({ title: "" })).success).toBe(false);
    expect(pageInputSchema.safeParse(body({ status: "OTHER" })).success).toBe(false);
  });
});

describe("pages API", () => {
  it("the seed created the 6 info pages, public list and page work", async () => {
    const list = await request(app).get("/api/v1/pages").expect(200);
    const slugs = list.body.map((p: { slug: string }) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(["about", "contact", "delivery", "returns", "privacy", "terms"]));
    const page = await request(app).get("/api/v1/pages/privacy").expect(200);
    expect(page.body).toMatchObject({ slug: "privacy", title: "Privacy and cookies" });
    expect(page.body.content).toContain("<table>");
    expect(page.body).not.toHaveProperty("status");
  });

  it("admin routes need an admin", async () => {
    await request(app).get("/api/v1/admin/pages").expect(401);
    await request(app).post("/api/v1/admin/pages").send(body()).expect(401);
    const customer = request.agent(app);
    await customer.post("/api/v1/auth/register").send({ email: `pg-${Date.now()}@example.com`, password: "password123", name: "Customer" }).expect(201);
    await customer.post("/api/v1/admin/pages").send(body()).expect(403);
    await customer.delete("/api/v1/admin/pages/whatever").expect(403);
  });

  it("create → public read → draft is hidden → duplicate slug → delete", async () => {
    const dirty = '<h2>Hello</h2><script>alert(1)</script><p onclick="x()">Text</p><iframe src="https://evil.example"></iframe>';
    const created = await admin.post("/api/v1/admin/pages").send(body({ content: dirty, showInFooter: true })).expect(201);
    // cleaned on save
    expect(created.body.content).toBe("<h2>Hello</h2><p>Text</p>");
    const id = created.body.id as string;

    const pub = await request(app).get("/api/v1/pages/test-page").expect(200);
    expect(pub.body.content).toBe("<h2>Hello</h2><p>Text</p>");
    const list = await request(app).get("/api/v1/pages").expect(200);
    expect(list.body.find((p: { slug: string }) => p.slug === "test-page")).toMatchObject({ showInFooter: true, sortOrder: 5 });

    // unique slug
    const dup = await admin.post("/api/v1/admin/pages").send(body()).expect(409);
    expect(dup.body.message).toMatch(/already exists/);

    // bad input
    const bad = await admin.post("/api/v1/admin/pages").send(body({ slug: "Not Valid" })).expect(400);
    expect(bad.body.errors.fieldErrors.slug).toBeTruthy();

    // draft → 404 for visitors, still there for the admin
    await admin.put(`/api/v1/admin/pages/${id}`).send(body({ status: "DRAFT" })).expect(200);
    await request(app).get("/api/v1/pages/test-page").expect(404);
    expect((await request(app).get("/api/v1/pages")).body.some((p: { slug: string }) => p.slug === "test-page")).toBe(false);
    await admin.get(`/api/v1/admin/pages/${id}`).expect(200);

    // XSS also on update
    const upd = await admin.put(`/api/v1/admin/pages/${id}`).send(body({ content: '<img src=x onerror="alert(1)"><p>ok</p>' })).expect(200);
    expect(upd.body.content).not.toContain("onerror");

    const list2 = await admin.get("/api/v1/admin/pages?filter=test-page").expect(200);
    expect(list2.headers["content-range"]).toMatch(/^pages \d+-\d+\/1$/);

    await admin.delete(`/api/v1/admin/pages/${id}`).expect(200);
    await request(app).get("/api/v1/pages/test-page").expect(404);
    await admin.get(`/api/v1/admin/pages/${id}`).expect(404);
  });

  it("missing or badly formed slugs are 404", async () => {
    await request(app).get("/api/v1/pages/no-such-page").expect(404);
    await request(app).get("/api/v1/pages/Bad%20Slug").expect(404);
  });

  it("core pages (privacy, terms) cannot be deleted or renamed", async () => {
    const list = await admin.get("/api/v1/admin/pages?perPage=50").expect(200);
    const privacy = list.body.find((p: { slug: string }) => p.slug === "privacy");
    expect(privacy.isCore).toBe(true);
    await admin.delete(`/api/v1/admin/pages/${privacy.id}`).expect(409);
    await admin.put(`/api/v1/admin/pages/${privacy.id}`).send(body({ slug: "privacy-2" })).expect(400);
    // the text can still be edited
    const { id, createdAt, updatedAt, isCore, ...rest } = privacy;
    void createdAt; void updatedAt; void isCore;
    await admin.put(`/api/v1/admin/pages/${id}`).send(rest).expect(200);
    // other pages are not core
    const about = list.body.find((p: { slug: string }) => p.slug === "about");
    expect(about.isCore).toBe(false);
  });
});
