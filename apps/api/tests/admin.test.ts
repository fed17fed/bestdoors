import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

process.env.UPLOAD_DIR = mkdtempSync(path.join(tmpdir(), "bestdoors-test-"));
process.env.BLOB_READ_WRITE_TOKEN = "";

const app = createApp();
const admin = request.agent(app);

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

type Value = { id?: string; code: string; priceDelta: number; swatch: string; isDefault: boolean; translations: { locale: string; label: string }[] };
const asInput = (g: { sortOrder: number; translations: unknown[]; values: Value[] }): { sortOrder: number; translations: unknown[]; values: Value[] } => ({
  sortOrder: g.sortOrder,
  translations: g.translations,
  values: g.values.map(({ id, code, priceDelta, swatch, isDefault, translations }) => ({ id, code, priceDelta, swatch, isDefault, translations })),
});

beforeAll(async () => {
  await admin
    .post("/api/v1/auth/login")
    .send({ email: process.env.ADMIN_EMAIL ?? "admin@bestdoors.ie", password: process.env.ADMIN_PASSWORD })
    .expect(200);
});

describe("admin: option groups", () => {
  it("edits values and keeps the ids of existing ones (then restores the seed)", async () => {
    const list = await admin.get("/api/v1/admin/option-groups").expect(200);
    const glassId = list.body.find((g: { code: string }) => g.code === "glass").id;
    const original = (await admin.get(`/api/v1/admin/option-groups/${glassId}`).expect(200)).body;
    const ids = original.values.map((v: Value) => v.id);

    try {
      const changed = asInput(original);
      changed.values[0].priceDelta += 10;
      changed.values.push({ code: "test-tinted", priceDelta: 99, swatch: "", isDefault: false, translations: [{ locale: "en", label: "Tinted" }] });
      const res = await admin.put(`/api/v1/admin/option-groups/${glassId}`).send(changed).expect(200);
      expect(res.body.values.map((v: Value) => v.id).slice(0, ids.length)).toEqual(ids);
      expect(res.body.values[0].priceDelta).toBe(original.values[0].priceDelta + 10);
      expect(res.body.values.at(-1)).toMatchObject({ code: "test-tinted", priceDelta: 99, label: "Tinted" });

      // validation: two defaults, duplicate codes, bad colour
      const bad = asInput(original);
      bad.values = bad.values.map((v) => ({ ...v, isDefault: true }));
      await admin.put(`/api/v1/admin/option-groups/${glassId}`).send(bad).expect(400);
      const dup = asInput(original);
      dup.values.push({ ...dup.values[0], id: undefined });
      await admin.put(`/api/v1/admin/option-groups/${glassId}`).send(dup).expect(400);
      const colour = asInput(original);
      colour.values[0].swatch = "red";
      await admin.put(`/api/v1/admin/option-groups/${glassId}`).send(colour).expect(400);
    } finally {
      const back = await admin.put(`/api/v1/admin/option-groups/${glassId}`).send(asInput(original)).expect(200);
      expect(back.body.values.map((v: Value) => v.id)).toEqual(ids);
      expect(back.body.values.map((v: Value) => v.priceDelta)).toEqual(original.values.map((v: Value) => v.priceDelta));
    }
  });
});

describe("admin: orders", () => {
  it("lists with filter/search and changes status with rules", async () => {
    // a paid order made directly in the DB
    const p = await prisma.product.findFirstOrThrow({ where: { slug: "dublin-composite-front-door" } });
    const order = await prisma.order.create({
      data: {
        email: `admin-test-${Date.now()}@example.com`, status: "PAID", subtotal: 100, vatAmount: 18.7, total: 100,
        items: { create: [{ productId: p.id, productName: "Test door", options: [], quantity: 1, unitPrice: 100 }] },
      },
    });
    const pending = await prisma.order.create({ data: { email: "pending@example.com", subtotal: 1, vatAmount: 0.19, total: 1 } });

    const list = await admin.get(`/api/v1/admin/orders?filter=${encodeURIComponent('{"status":"PAID"}')}&perPage=100`).expect(200);
    expect(list.headers["content-range"]).toMatch(/^orders /);
    expect(list.body.every((o: { status: string }) => o.status === "PAID")).toBe(true);
    const byNumber = await admin.get(`/api/v1/admin/orders?filter=${encodeURIComponent(JSON.stringify({ q: `#${order.number}` }))}`).expect(200);
    expect(byNumber.body[0]).toMatchObject({ id: order.id, number: order.number, itemCount: 1 });

    const upd = await admin.put(`/api/v1/admin/orders/${order.id}`).send({ status: "SHIPPED" }).expect(200);
    expect(upd.body.status).toBe("SHIPPED");
    await admin.put(`/api/v1/admin/orders/${order.id}`).send({ status: "PAID" }).expect(400);
    await admin.put(`/api/v1/admin/orders/${pending.id}`).send({ status: "SHIPPED" }).expect(400);
    await admin.put(`/api/v1/admin/orders/${pending.id}`).send({ status: "CANCELLED" }).expect(200);

    await request(app).get("/api/v1/admin/orders").expect(401);
  });
});

describe("admin: uploads and errors", () => {
  it("uploads a product image (admin only)", async () => {
    const res = await admin.post("/api/v1/admin/uploads").set("Content-Type", "image/png").send(PNG).expect(201);
    expect(res.body.url).toMatch(/\/uploads\/products\/.+\.png$/);
    await request(app).post("/api/v1/admin/uploads").set("Content-Type", "image/png").send(PNG).expect(401);
  });

  it("a category with products cannot be deleted (409, not 500)", async () => {
    const cat = await prisma.category.findFirstOrThrow({ where: { products: { some: {} } } });
    await admin.delete(`/api/v1/admin/categories/${cat.id}`).expect(409);
    expect(await prisma.category.count({ where: { id: cat.id } })).toBe(1);
  });
});
