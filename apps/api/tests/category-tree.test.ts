import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { assertValidParent } from "../src/lib/category-tree";
import { prisma } from "../src/lib/prisma";

const app = createApp();
const admin = request.agent(app);

const slugs = async (query: string) =>
  ((await request(app).get(`/api/v1/products?perPage=60&${query}`).expect(200)).body.data as { slug: string }[]).map((p) => p.slug);

beforeAll(async () => {
  await admin
    .post("/api/v1/auth/login")
    .send({ email: process.env.ADMIN_EMAIL ?? "admin@bestdoors.ie", password: process.env.ADMIN_PASSWORD })
    .expect(200);
});

describe("assertValidParent (pure rules)", () => {
  const main = { id: "m", parentId: null };
  it("accepts no parent and a main category as parent", () => {
    expect(() => assertValidParent({ id: "x", parentId: null, parent: null, childCount: 3 })).not.toThrow();
    expect(() => assertValidParent({ id: "x", parentId: "m", parent: main, childCount: 0 })).not.toThrow();
  });
  it("rejects itself, a missing parent, a sub-category parent and a category that has children", () => {
    expect(() => assertValidParent({ id: "x", parentId: "x", parent: { id: "x", parentId: null }, childCount: 0 })).toThrow(/own parent/);
    expect(() => assertValidParent({ id: "x", parentId: "zz", parent: null, childCount: 0 })).toThrow(/not found/);
    expect(() => assertValidParent({ id: "x", parentId: "s", parent: { id: "s", parentId: "m" }, childCount: 0 })).toThrow(/max 2 levels/);
    expect(() => assertValidParent({ id: "x", parentId: "m", parent: main, childCount: 1 })).toThrow(/subcategories/);
  });
});

describe("category tree: catalog API", () => {
  it("lists parentId / parentSlug for the tree", async () => {
    const cats = (await request(app).get("/api/v1/categories").expect(200)).body as { slug: string; parentId: string | null; parentSlug: string | null }[];
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));
    expect(bySlug["exterior-doors"]!.parentId).toBeNull();
    expect(bySlug["interior-doors"]!.parentId).toBeNull();
    expect(bySlug["sliding-doors"]!.parentSlug).toBe("exterior-doors");
    expect(bySlug["interior-sliding-doors"]!.parentSlug).toBe("interior-doors");
    expect(bySlug["interior-french-doors"]!.parentSlug).toBe("interior-doors");
  });

  it("a main category shows its own products plus the products of its subcategories", async () => {
    const ext = await slugs("category=exterior-doors");
    expect(ext).toEqual(expect.arrayContaining(["dublin-composite-front-door", "atlantic-patio-door", "howth-sliding-patio-door", "kilkenny-french-door"]));
    expect(ext).not.toContain("clare-pocket-door");
    const int = await slugs("category=interior-doors");
    expect(int).toEqual(expect.arrayContaining(["liffey-white-panel-door", "slaney-black-industrial-door", "clare-pocket-door", "sligo-barn-door", "donegal-interior-french-door"]));
    expect(int).not.toContain("howth-sliding-patio-door");
    expect(int).toHaveLength(9);
  });

  it("a subcategory shows only its own products and gives the main category for breadcrumbs", async () => {
    expect((await slugs("category=interior-sliding-doors")).sort()).toEqual(["clare-pocket-door", "sligo-barn-door"]);
    expect(await slugs("category=sliding-doors")).toEqual(["howth-sliding-patio-door"]);
    const p = (await request(app).get("/api/v1/products/howth-sliding-patio-door").expect(200)).body;
    expect(p.category.parent).toEqual({ slug: "exterior-doors", name: "Exterior Doors" });
    const own = (await request(app).get("/api/v1/products/liffey-white-panel-door").expect(200)).body;
    expect(own.category.parent).toBeNull();
  });
});

describe("category tree: admin validation", () => {
  const body = (slug: string, parentId: string | null) => ({
    slug,
    type: "SLIDING",
    parentId,
    translations: [{ locale: "en", name: slug, description: "" }],
  });
  const idOf = async (slug: string) => (await prisma.category.findUniqueOrThrow({ where: { slug } })).id;

  it("creates a subcategory under a main category, and rejects a third level", async () => {
    const parentId = await idOf("interior-doors");
    const sub = await admin.post("/api/v1/admin/categories").send(body("tree-test-sub", parentId)).expect(201);
    expect(sub.body.parentId).toBe(parentId);
    await admin.post("/api/v1/admin/categories").send(body("tree-test-third", sub.body.id)).expect(400);
    expect(await prisma.category.count({ where: { slug: "tree-test-third" } })).toBe(0);
    await admin.delete(`/api/v1/admin/categories/${sub.body.id}`).expect(200);
  });

  it("rejects self-parent, an unknown parent, and a main category with children becoming a sub", async () => {
    const ext = await idOf("exterior-doors");
    const interior = await idOf("interior-doors");
    const current = (await admin.get(`/api/v1/admin/categories/${ext}`).expect(200)).body;
    const put = (id: string, parentId: string | null) =>
      admin.put(`/api/v1/admin/categories/${id}`).send({ ...body(current.slug, parentId), type: "EXTERIOR", translations: current.translations });
    await put(ext, ext).expect(400);
    await put(ext, "does-not-exist").expect(400);
    await put(ext, interior).expect(400); // exterior-doors has subcategories
    expect((await prisma.category.findUniqueOrThrow({ where: { id: ext } })).parentId).toBeNull();
  });

  it("a category with subcategories cannot be deleted (409)", async () => {
    await admin.delete(`/api/v1/admin/categories/${await idOf("exterior-doors")}`).expect(409);
  });
});
