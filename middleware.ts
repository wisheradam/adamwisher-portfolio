import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "adam_projects_session";

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return new Uint8Array();
  }
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function hasValidSession(request: NextRequest) {
  const secret = process.env.PROJECTS_SESSION_SECRET;
  const value = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !value) return false;

  const [version, expiresAtRaw, signatureHex] = value.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (version !== "v1" || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signatureHex),
      new TextEncoder().encode(`${version}.${expiresAtRaw}`),
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/projects/login";
  const authenticated = await hasValidSession(request);

  if (!isLogin && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects/login";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store, private");
    return response;
  }

  if (isLogin && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store, private");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: ["/projects/:path*"],
};
