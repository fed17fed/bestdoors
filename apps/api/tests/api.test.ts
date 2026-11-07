import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("catalog", () => {
  it("health", async () => {
    await request(app).get("/api/v1/health").expect(200, { ok: true });
  });

  it("returns categories in English; an old ?locale=uk falls back to English", async () => {
    for (const url of ["/api/v1/categories", "/api/v1/categories?locale=uk"]) {
      const res = await request(app).get(url).expect(200);
      expect(res.body.find((c: { slug: string }) => c.slug === "interior-doors").name).toBe("Interior Doors");
    }
  });

  it("filters and sorts products", async () => {
    const res = await request(app)
      .get("/api/v1/products?category=interior-doors&sort=price-asc")
      .expect(200);
    const prices = res.body.data.map((p: { price: number }) => p.price);
    expect(prices.length).toBeGreaterThan(0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    expect(res.body.facets.materials.length).toBeGreaterThan(0);
  });

  it("calculates the configured price on the server", async () => {
    const product = (await request(app).get("/api/v1/products/dublin-composite-front-door")).body;
    const colour = product.optionGroups.find((g: { code: string }) => g.code === "colour");
    const oak = colour.values.find((v: { code: string }) => v.code === "oak");
    const res = await request(app)
      .post(`/api/v1/products/${product.id}/price`)
      .send({ selection: { [colour.id]: oak.id } })
      .expect(200);
    expect(res.body.price).toBe(product.price + oak.priceDelta);
  });

  it("rejects options that do not belong to the product", async () => {
    const product = (await request(app).get("/api/v1/products/dublin-composite-front-door")).body;
    await request(app)
      .post(`/api/v1/products/${product.id}/price`)
      .send({ selection: { nope: "nope" } })
      .expect(400);
  });

  it("404 for unknown product", async () => {
    await request(app).get("/api/v1/products/no-such-door").expect(404);
  });
});

describe("auth and admin", () => {
  it("blocks admin routes without a session", async () => {
    await request(app).get("/api/v1/admin/products").expect(401);
  });

  it("customer can register but cannot use admin routes", async () => {
    const agent = request.agent(app);
    const email = `test-${Date.now()}@example.com`;
    await agent
      .post("/api/v1/auth/register")
      .send({ email, password: "password123", name: "Test User", locale: "en" })
      .expect(201);
    const me = await agent.get("/api/v1/auth/me").expect(200);
    expect(me.body).toMatchObject({ email, role: "CUSTOMER", locale: "en" });
    await agent.get("/api/v1/admin/products").expect(403);
  });

  it("admin can list products with Content-Range", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/v1/auth/login")
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
      .expect(200);
    const res = await agent.get("/api/v1/admin/products?perPage=5").expect(200);
    expect(res.headers["content-range"]).toMatch(/^products 0-4\/\d+$/);
  });

  it("rejects a wrong password", async () => {
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@bestdoors.ie", password: "wrong" })
      .expect(401);
  });
});
