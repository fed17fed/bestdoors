import bcrypt from "bcryptjs";
import type { Locale } from "@bestdoors/shared";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";

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
};
