import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Locale } from "@bestdoors/shared";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { env } from "../lib/env";
import { sendEmail } from "../lib/mailer";
import { passwordResetEmail } from "../emails/password-reset";

const publicUser = { id: true, email: true, name: true, role: true, locale: true } as const;

export const authService = {
  async register(input: { email: string; password: string; name: string; locale: Locale }) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new HttpError(409, "Email is already registered");
    return prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        locale: input.locale,
        passwordHash: await bcrypt.hash(input.password, 12),
      },
      select: publicUser,
    });
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always run bcrypt so response time does not reveal if the email exists.
    const ok = await bcrypt.compare(password, user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    if (!user || !ok) throw new HttpError(401, "Invalid email or password");
    return { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale };
  },

  me(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUser });
  },

  /**
   * "Forgot password": emails a reset link if the email is registered.
   * Always resolves the same way, so the answer does not reveal which emails exist.
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = jwt.sign({ sub: user.id, purpose: "password-reset", pv: passwordVersion(user.passwordHash) }, resetSecret(), {
      expiresIn: RESET_MINUTES * 60,
    });
    // Hash part (#/...) is never sent to a server, so the token does not end up in logs.
    const link = `${env().WEB_URL}/admin#/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail(passwordResetEmail(user, link, RESET_MINUTES));
  },

  /** Sets a new password from a reset link. The link stops working once the password changes. */
  async resetPassword(token: string, password: string) {
    const invalid = new HttpError(400, "This link is invalid or has expired. Please ask for a new one.");
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, resetSecret()) as jwt.JwtPayload;
    } catch {
      throw invalid;
    }
    if (payload.purpose !== "password-reset" || typeof payload.sub !== "string") throw invalid;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || payload.pv !== passwordVersion(user.passwordHash)) throw invalid;
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  },
};

const RESET_MINUTES = 60;

/** Separate key from the session key, so a reset token can never work as a login cookie. */
function resetSecret() {
  return `${env().JWT_SECRET}:password-reset`;
}

/** Short fingerprint of the current password hash: a new password makes old links invalid. */
function passwordVersion(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}
