import request from "supertest";
import Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { setStripeClient } from "../src/lib/stripe";
import { setEmailSender, type Email } from "../src/lib/mailer";
import { prisma } from "../src/lib/prisma";

// Stripe is mocked: no network calls. Webhook signatures use the real Stripe helpers.
const WEBHOOK_SECRET = "whsec_test_bestdoors";
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const fake = new Stripe("sk_test_fake_key_for_tests");
const sessions = new Map<string, Stripe.Checkout.Session>();
let created: Stripe.Checkout.SessionCreateParams | undefined;
let n = 0;

vi.spyOn(fake.checkout.sessions, "create").mockImplementation((async (params: Stripe.Checkout.SessionCreateParams) => {
  created = params;
  const id = `cs_test_${Date.now()}${++n}abcdefghij`;
  const amount = params.line_items!.reduce((s, l) => s + l.price_data!.unit_amount! * l.quantity!, 0);
  const session = {
    id,
    object: "checkout.session",
    url: `https://checkout.stripe.com/c/pay/${id}`,
    metadata: params.metadata,
    payment_status: "unpaid",
    amount_total: amount,
    customer_details: null,
    collected_information: null,
  } as unknown as Stripe.Checkout.Session;
  sessions.set(id, session);
  return session;
}) as never);
vi.spyOn(fake.checkout.sessions, "retrieve").mockImplementation((async (id: string) => {
  const s = sessions.get(id);
  if (!s) throw new Error("No such checkout session");
  return s;
}) as never);
setStripeClient(fake);

const emails: Email[] = [];
setEmailSender(async (e) => {
  emails.push(e);
});

afterAll(() => {
  setStripeClient(undefined);
  setEmailSender(undefined);
});

const app = createApp();

function paid(session: Stripe.Checkout.Session): Stripe.Checkout.Session {
  return {
    ...session,
    payment_status: "paid",
    customer_details: { email: "buyer@example.com", phone: "+353871234567" },
    collected_information: {
      shipping_details: {
        name: "Aoife Murphy",
        address: { line1: "1 Main Street", line2: null, city: "Galway", state: "Co. Galway", postal_code: "H91 AB12", country: "IE" },
      },
    },
  } as unknown as Stripe.Checkout.Session;
}

function webhook(type: string, object: unknown, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify({ id: `evt_${Date.now()}`, object: "event", type, data: { object } });
  const header = fake.webhooks.generateTestHeaderString({ payload, secret });
  return request(app)
    .post("/api/v1/stripe/webhook")
    .set("Content-Type", "application/json")
    .set("Stripe-Signature", header)
    .send(payload);
}

async function guestWithCart() {
  const agent = request.agent(app);
  const p = (await agent.get("/api/v1/products/dublin-composite-front-door")).body;
  await agent.post("/api/v1/cart/items").send({ productId: p.id, quantity: 2 }).expect(201);
  return { agent, p };
}

beforeEach(() => {
  emails.length = 0;
  created = undefined;
});

describe("checkout", () => {
  it("empty cart cannot be paid", async () => {
    await request(app).post("/api/v1/checkout").expect(400);
  });

  it("creates a pending order and a Stripe session with server prices", async () => {
    const { agent, p } = await guestWithCart();
    const res = await agent.post("/api/v1/checkout").expect(200);
    expect(res.body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);

    expect(created!.mode).toBe("payment");
    expect(created!.line_items).toHaveLength(1);
    expect(created!.line_items![0]).toMatchObject({
      quantity: 2,
      price_data: { currency: "eur", unit_amount: Math.round(p.price * 100), tax_behavior: "inclusive" },
    });
    expect(created!.line_items![0].price_data!.product_data!.name).toBe("Dublin Composite Front Door");
    expect(created!.shipping_address_collection!.allowed_countries).toEqual(["IE"]);
    expect(created!.success_url).toMatch(/\/en\/checkout\/success\?session_id=\{CHECKOUT_SESSION_ID\}$/);

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: created!.metadata!.orderId as string },
      include: { items: true },
    });
    expect(order.status).toBe("PENDING");
    expect(order.locale).toBe("en");
    expect(Number(order.total)).toBe(2 * p.price);
    expect(order.items[0].quantity).toBe(2);
  });

  it("webhook with a bad signature is rejected", async () => {
    await webhook("checkout.session.completed", {}, "whsec_wrong").expect(400);
    await request(app).post("/api/v1/stripe/webhook").send({}).expect(400);
  });

  it("paid webhook → order PAID, cart emptied, one email (idempotent)", async () => {
    const { agent } = await guestWithCart();
    const { body } = await agent.post("/api/v1/checkout").expect(200);
    const id = body.url.split("/").pop();
    const session = paid(sessions.get(id)!);
    sessions.set(id, session);

    await webhook("checkout.session.completed", session).expect(200);
    await webhook("checkout.session.completed", session).expect(200); // Stripe may send it twice

    const order = await prisma.order.findFirstOrThrow({ where: { stripeSessionId: id } });
    expect(order.status).toBe("PAID");
    expect(order.email).toBe("buyer@example.com");
    expect(order.shippingAddress).toMatchObject({ city: "Galway", postalCode: "H91 AB12" });

    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe("buyer@example.com");
    expect(emails[0].subject).toContain(`#${order.number}`);
    expect(emails[0].html).toContain("Dublin");

    const cart = await agent.get("/api/v1/cart").expect(200);
    expect(cart.body.count).toBe(0);

    // The success page reads the same order.
    const confirm = await agent.get(`/api/v1/checkout/session/${id}`).expect(200);
    expect(confirm.body).toMatchObject({ number: order.number, status: "PAID", email: "buyer@example.com" });
    expect(emails).toHaveLength(1);
  });

  it("success page marks the order paid even before the webhook", async () => {
    const { agent } = await guestWithCart();
    const { body } = await agent.post("/api/v1/checkout").expect(200);
    const id = body.url.split("/").pop();
    sessions.set(id, paid(sessions.get(id)!));

    const res = await agent.get(`/api/v1/checkout/session/${id}`).expect(200);
    expect(res.body.status).toBe("PAID");
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toMatch(/^Mr\.Door order #\d+ confirmed$/);

    await request(app).get("/api/v1/checkout/session/not-a-session").expect(400);
  });

  it("expired session → order CANCELLED, cart kept", async () => {
    const { agent } = await guestWithCart();
    const { body } = await agent.post("/api/v1/checkout").expect(200);
    const id = body.url.split("/").pop();

    await webhook("checkout.session.expired", sessions.get(id)).expect(200);
    const order = await prisma.order.findFirstOrThrow({ where: { stripeSessionId: id } });
    expect(order.status).toBe("CANCELLED");
    expect((await agent.get("/api/v1/cart")).body.count).toBe(2);

    // A paid event for a cancelled order changes nothing.
    await webhook("checkout.session.completed", paid(sessions.get(id)!)).expect(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect(emails).toHaveLength(0);
  });

  it("logged-in customer: email prefilled and order in /me/orders", async () => {
    const agent = request.agent(app);
    const email = `buyer-${Date.now()}@example.com`;
    await agent.post("/api/v1/auth/register").send({ email, password: "password123", name: "Buyer" }).expect(201);
    const p = (await agent.get("/api/v1/products/dublin-composite-front-door")).body;
    await agent.post("/api/v1/cart/items").send({ productId: p.id }).expect(201);

    const { body } = await agent.post("/api/v1/checkout").expect(200);
    expect(created!.customer_email).toBe(email);
    const id = body.url.split("/").pop();
    await webhook("checkout.session.completed", paid(sessions.get(id)!)).expect(200);

    const list = await agent.get("/api/v1/me/orders").expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ status: "PAID", total: p.price });
    await agent.get(`/api/v1/me/orders/${list.body[0].number}`).expect(200);
    await request(app).get("/api/v1/me/orders").expect(401);
  });
});
