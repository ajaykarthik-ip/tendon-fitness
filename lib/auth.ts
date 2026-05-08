// Node-runtime auth helpers (password hashing + request helpers).
// Re-exports edge-safe token helpers from ./auth-token.

import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import {
  AUTH_COOKIE,
  TOKEN_TTL_SECONDS,
  signToken,
  verifyToken,
  type TokenPayload,
} from "./auth-token";

export { AUTH_COOKIE, TOKEN_TTL_SECONDS, signToken, verifyToken };
export type { TokenPayload };

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function extractToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === AUTH_COOKIE) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function requireAuth(req: Request): Promise<TokenPayload> {
  const payload = await verifyToken(extractToken(req));
  if (!payload) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  return payload;
}

export const TOKEN_COOKIE_OPTIONS = {
  name: AUTH_COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
  secure: process.env.NODE_ENV === "production",
};
