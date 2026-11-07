import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

async function dublin() {
  const p = (await request(app).get("/api/v1/products/dublin-composite-front-door")).body;
  const colour = p.optionGroups.find((g: { code: string }) => g.code === "colour");
  const oak = colour.values.find((v: { code: string }) => v.code === "oak");
  return { p, colour, oak };
}

describe("cart", () => {
  it("guest can add, merge same config, change quantity and remove", async () => {
    const agent = request.agent(app);
    const { p, colour, oak } = await dublin();

    const empty = await agent.get("/api/v1/cart").expect(200);
    expect(empty.body).toMatchObject({ items: [], count: 0, subtotal: 0 });

    const r1 = await agent
      .post("/api/v1/cart/items")
      .send({ productId: p.id, selection: { [colour.id]: oak.id }, quantity: 1 })
      .expect(201);
    expect(String(r1.headers["set-cookie"])).toMatch(/bd_cart=/);
    expect(r1.body.items[0].unitPrice).toBe(p.price + oak.priceDelta);

    // same configuration -> same line, quantity 3
    const r2 = await agent
      .post("/api/v1/cart/items")
      .send({ productId: p.id, selection: { [colour.id]: oak.id }, quantity: 2 })
      .expect(201);
    expect(r2.body.items).toHaveLength(1);
    expect(r2.body.count).toBe(3);
    expect(r2.body.subtotal).toBe(3 * (p.price + oak.priceDelta));
    expect(r2.body.vat).toBeGreaterThan(0);

    // default configuration -> new line
    const r3 = await agent.post("/api/v1/cart/items").send({ productId: p.id }).expect(201);
    expect(r3.body.items).toHaveLength(2);

    const lineId = r3.body.items[0].id;
    const r4 = await agent.patch(`/api/v1/cart/items/${lineId}`).send({ quantity: 1 }).expect(200);
    expect(r4.body.items[0].quantity).toBe(1);
    await agent.patch(`/api/v1/cart/items/${lineId}`).send({ quantity: 99 }).expect(400);

    const r5 = await agent.delete(`/api/v1/cart/items/${lineId}`).expect(200);
    expect(r5.body.items).toHaveLength(1);
  });

  it("old ?locale=uk still gives English names in the cart", async () => {
    const agent = request.agent(app);
    const { p } = await dublin();
    await agent.post("/api/v1/cart/items").send({ productId: p.id }).expect(201);
    const res = await agent.get("/api/v1/cart?locale=uk").expect(200);
    expect(res.body.items[0].name).toBe("Dublin Composite Front Door");
  });

  it("rejects bad products and other people's items", async () => {
    const a = request.agent(app);
    const b = request.agent(app);
    await a.post("/api/v1/cart/items").send({ productId: "nope" }).expect(404);
    const { p } = await dublin();
    const added = await a.post("/api/v1/cart/items").send({ productId: p.id }).expect(201);
    const itemId = added.body.items[0].id;
    await b.delete(`/api/v1/cart/items/${itemId}`).expect(404);
  });

  it("a forged cart cookie is ignored", async () => {
    const res = await request(app).get("/api/v1/cart").set("Cookie", "bd_cart=s%3Afake.sig").expect(200);
    expect(res.body.count).toBe(0);
  });

  it("guest cart moves to the account on register", async () => {
    const agent = request.agent(app);
    const { p } = await dublin();
    await agent.post("/api/v1/cart/items").send({ productId: p.id, quantity: 2 }).expect(201);
    await agent
      .post("/api/v1/auth/register")
      .send({ email: `cart-${Date.now()}@example.com`, password: "password123", name: "Cart User" })
      .expect(201);
    const res = await agent.get("/api/v1/cart").expect(200);
    expect(res.body.count).toBe(2);
  });
});
