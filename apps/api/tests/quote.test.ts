import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { setEmailSender, type Email } from "../src/lib/mailer";
import { prisma } from "../src/lib/prisma";

// Photos go to a temporary system folder; no Blob token in tests; a shop email is set.
process.env.UPLOAD_DIR = mkdtempSync(path.join(tmpdir(), "bestdoors-test-"));
process.env.BLOB_READ_WRITE_TOKEN = "";
process.env.SHOP_EMAIL = "shop@example.com";

const emails: Email[] = [];
setEmailSender(async (e) => {
  emails.push(e);
});
afterAll(() => setEmailSender(undefined));
beforeEach(() => {
  emails.length = 0;
});

const app = createApp();

// Smallest valid PNG (1×1 pixel).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const base = { name: "Seán Kelly", email: "Sean@Example.com", doorType: "EXTERIOR", widthMm: 950, heightMm: 2100 };

describe("quotes", () => {
  it("uploads a photo and creates a quote; emails shop + customer", async () => {
    const up = await request(app).post("/api/v1/quotes/photos").set("Content-Type", "image/png").send(PNG).expect(201);
    expect(up.body.url).toMatch(/\/api\/v1\/uploads\/quotes\/\d{4}-\d{2}-\d{2}-[0-9a-f-]{36}\.png$/);

    // The uploaded file can be read back (development mode).
    const local = new URL(up.body.url).pathname;
    const img = await request(app).get(local).expect(200);
    expect(img.headers["content-type"]).toBe("image/png");

    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ ...base, eircode: "d02x285", message: "Wide front door", photos: [up.body.url], locale: "en" })
      .expect(201);
    expect(res.body.reference).toMatch(/^Q-[A-Z0-9]{6}$/);

    const q = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(q).toMatchObject({ email: "sean@example.com", eircode: "D02 X285", status: "NEW", locale: "en", widthMm: 950 });
    expect(q.photos).toEqual([up.body.url]);

    expect(emails).toHaveLength(2);
    const customer = emails.find((e) => e.to === "sean@example.com")!;
    expect(customer.subject).toBe(`We received your quote request ${res.body.reference}`);
    const shop = emails.find((e) => e.to === "shop@example.com")!;
    expect(shop.replyTo).toBe("sean@example.com");
    expect(shop.html).toContain(up.body.url);
    expect(shop.html).toContain("Seán Kelly");
  });

  it("links the product when the quote comes from a product page", async () => {
    const p = (await request(app).get("/api/v1/products/dublin-composite-front-door")).body;
    const res = await request(app).post("/api/v1/quotes").send({ ...base, productId: p.id }).expect(201);
    const q = await prisma.quoteRequest.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(q.productId).toBe(p.id);
    expect(emails[0].html).toContain("Dublin");
  });

  it("rejects bad data, foreign photo URLs and non-image files", async () => {
    await request(app).post("/api/v1/quotes").send({ ...base, email: "nope" }).expect(400);
    await request(app).post("/api/v1/quotes").send({ ...base, eircode: "12345" }).expect(400);
    await request(app).post("/api/v1/quotes").send({ ...base, doorType: "GARAGE" }).expect(400);
    await request(app)
      .post("/api/v1/quotes")
      .send({ ...base, photos: ["https://evil.example.com/x.png"] })
      .expect(400);
    // A text file that says it is a JPG is refused (checked by the file bytes).
    await request(app).post("/api/v1/quotes/photos").set("Content-Type", "image/jpeg").send(Buffer.from("hello, not an image at all")).expect(415);
    await request(app).post("/api/v1/quotes/photos").set("Content-Type", "text/plain").send("hi").expect(415);
    expect(emails).toHaveLength(0);
  });

  it("honeypot: bots get a fake success and nothing is saved", async () => {
    const before = await prisma.quoteRequest.count();
    await request(app).post("/api/v1/quotes").send({ ...base, website: "http://spam.example" }).expect(201);
    expect(await prisma.quoteRequest.count()).toBe(before);
    expect(emails).toHaveLength(0);
  });

  it("admin can list, open and change status; customers cannot", async () => {
    const created = await request(app).post("/api/v1/quotes").send(base).expect(201);
    const admin = request.agent(app);
    await admin
      .post("/api/v1/auth/login")
      .send({ email: process.env.ADMIN_EMAIL ?? "admin@bestdoors.ie", password: process.env.ADMIN_PASSWORD })
      .expect(200);

    const list = await admin.get(`/api/v1/admin/quotes?filter=${encodeURIComponent('{"status":"NEW"}')}&perPage=5`).expect(200);
    expect(list.headers["content-range"]).toMatch(/^quotes 0-\d+\/\d+$/);
    expect(list.body.every((q: { status: string }) => q.status === "NEW")).toBe(true);

    const one = await admin.get(`/api/v1/admin/quotes/${created.body.id}`).expect(200);
    expect(one.body.reference).toBe(created.body.reference);
    const upd = await admin.put(`/api/v1/admin/quotes/${created.body.id}`).send({ ...one.body, status: "IN_PROGRESS" }).expect(200);
    expect(upd.body.status).toBe("IN_PROGRESS");
    await admin.put(`/api/v1/admin/quotes/${created.body.id}`).send({ status: "MAYBE" }).expect(400);

    await request(app).get("/api/v1/admin/quotes").expect(401);
  });
});
