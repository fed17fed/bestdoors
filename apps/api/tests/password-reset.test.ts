import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { setEmailSender, type Email } from "../src/lib/mailer";

const emails: Email[] = [];
setEmailSender(async (e) => {
  emails.push(e);
});
afterAll(() => setEmailSender(undefined));
beforeEach(() => {
  emails.length = 0;
});

const app = createApp();

/** Registers a fresh customer and returns its email. */
async function newUser(locale: "en" = "en") {
  const email = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  await request(app).post("/api/v1/auth/register").send({ email, password: "oldpassword1", name: "Reset User", locale }).expect(201);
  return email;
}

/** Token from the link in the last email. */
function tokenFromEmail() {
  const match = emails.at(-1)!.text.match(/#\/reset-password\?token=([^\s]+)/);
  expect(match).not.toBeNull();
  return decodeURIComponent(match![1]);
}

describe("forgot password", () => {
  it("emails a link, sets the new password, and the link works only once", async () => {
    const email = await newUser();
    await request(app).post("/api/v1/auth/forgot-password").send({ email: email.toUpperCase() }).expect(204);
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe(email);
    expect(emails[0].subject).toBe("Reset your Mr.Door password");
    expect(emails[0].text).toContain("/admin#/reset-password?token=");
    const token = tokenFromEmail();

    await request(app).post("/api/v1/auth/reset-password").send({ token, password: "newpassword123" }).expect(204);
    await request(app).post("/api/v1/auth/login").send({ email, password: "oldpassword1" }).expect(401);
    await request(app).post("/api/v1/auth/login").send({ email, password: "newpassword123" }).expect(200);

    // Same link again: refused, because the password has changed.
    const again = await request(app).post("/api/v1/auth/reset-password").send({ token, password: "anotherpass123" }).expect(400);
    expect(again.body.message).toMatch(/invalid or has expired/);
  });

  it("answers the same for an unknown email and sends nothing", async () => {
    await request(app).post("/api/v1/auth/forgot-password").send({ email: "nobody-here@example.com" }).expect(204);
    expect(emails).toHaveLength(0);
  });

  it("refuses a fake token, a session token, and a short password", async () => {
    await request(app).post("/api/v1/auth/reset-password").send({ token: "x".repeat(40), password: "newpassword123" }).expect(400);

    // A login cookie (signed with the session key) must not work as a reset token.
    const email = await newUser();
    const login = await request(app).post("/api/v1/auth/login").send({ email, password: "oldpassword1" }).expect(200);
    const sessionToken = String(login.headers["set-cookie"]).match(/bd_session=([^;]+)/)![1];
    await request(app).post("/api/v1/auth/reset-password").send({ token: sessionToken, password: "newpassword123" }).expect(400);

    await request(app).post("/api/v1/auth/forgot-password").send({ email }).expect(204);
    await request(app).post("/api/v1/auth/reset-password").send({ token: tokenFromEmail(), password: "short" }).expect(400);
  });

  it("a reset token cannot be used as a login cookie", async () => {
    const email = await newUser();
    await request(app).post("/api/v1/auth/forgot-password").send({ email }).expect(204);
    await request(app).get("/api/v1/auth/me").set("Cookie", `bd_session=${tokenFromEmail()}`).expect(401);
  });
});
