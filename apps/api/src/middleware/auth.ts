import type { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { HttpError } from "../lib/http-error";

export const AUTH_COOKIE = "bd_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = { id: string; role: "CUSTOMER" | "ADMIN" };

export function setSession(res: Response, user: SessionUser) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env().JWT_SECRET, {
    expiresIn: MAX_AGE_SECONDS,
  });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
}

/** Reads the session cookie (if any) into res.locals.user. Never fails. */
export const loadUser: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, env().JWT_SECRET) as jwt.JwtPayload;
      res.locals.user = { id: String(payload.sub), role: payload.role } satisfies SessionUser;
    } catch {
      // invalid or expired token: treat as guest
    }
  }
  next();
};

export const requireUser: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) return next(new HttpError(401, "Unauthorized"));
  next();
};

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (!res.locals.user) return next(new HttpError(401, "Unauthorized"));
  if (res.locals.user.role !== "ADMIN") return next(new HttpError(403, "Forbidden"));
  next();
};
