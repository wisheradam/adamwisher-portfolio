import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const PROJECTS_SESSION_COOKIE = "adam_projects_session";
export const PROJECTS_SESSION_MAX_AGE = 60 * 60 * 8;

const HASH_PREFIX = "scrypt";

function getPasswordHash() {
  return process.env.PROJECTS_PASSWORD_HASH?.trim() ?? "";
}

function getSessionSecret() {
  return process.env.PROJECTS_SESSION_SECRET?.trim() ?? "";
}

export function isProjectsAuthConfigured() {
  return Boolean(getPasswordHash() && getSessionSecret());
}

export function verifyProjectsPassword(password: string) {
  const stored = getPasswordHash();
  const [algorithm, salt, expectedHex] = stored.split(":");

  if (algorithm !== HASH_PREFIX || !salt || !expectedHex) {
    return false;
  }

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length > 0 && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function createProjectsSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + PROJECTS_SESSION_MAX_AGE;
  const payload = `v1.${expiresAt}`;
  return `${payload}.${signSessionPayload(payload)}`;
}

export function verifyProjectsSession(value: string | undefined) {
  if (!value || !isProjectsAuthConfigured()) {
    return false;
  }

  const [version, expiresAtRaw, signatureHex] = value.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (
    version !== "v1" ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !signatureHex
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(signSessionPayload(`${version}.${expiresAtRaw}`), "hex");
    const actual = Buffer.from(signatureHex, "hex");
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
