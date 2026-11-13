import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

const name = "adam_admin_session";
const ttl = 60 * 60 * 8;
const secret = () => process.env.ADMIN_SESSION_SECRET;

export type AdminRole = "SUPER_ADMIN" | "EDITOR" | "READ_ONLY";
export type AdminUser = { id: string; role: AdminRole };

export function checkPassword(password: string): boolean {
  const [algorithm, salt, expected] = (process.env.ADMIN_PASSWORD_HASH ?? "").split(":");
  if (algorithm !== "scrypt" || !salt || !/^[a-f0-9]{128}$/i.test(expected ?? "")) return false;
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, "hex");
  return timingSafeEqual(actual, target);
}

export function makeSession(): string {
  if (!secret() || secret()!.length < 32) throw new Error("Admin session secret is not configured");
  const expires = Math.floor(Date.now() / 1000) + ttl;
  const body = `v1.super-admin.${expires}`;
  const signature = createHmac("sha256", secret()!).update(body).digest("hex");
  return `${body}.${signature}`;
}

export function verifySession(value?: string): AdminUser | null {
  if (!secret() || !value) return null;
  const [version, id, expiry, signature] = value.split(".");
  if (version !== "v1" || id !== "super-admin" || !/^\d+$/.test(expiry ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? "")) return null;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return null;
  const expected = createHmac("sha256", secret()!).update(`${version}.${id}.${expiry}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  return { id, role: "SUPER_ADMIN" };
}

export async function adminUser(): Promise<AdminUser | null> {
  return verifySession((await cookies()).get(name)?.value);
}

export function adminCookie() { return name; }

export async function safeMutation(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return Boolean(origin && host && new URL(origin).host === host);
}
