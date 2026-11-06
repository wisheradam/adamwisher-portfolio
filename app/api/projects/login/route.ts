import { NextResponse } from "next/server";
import {
  createProjectsSession,
  isProjectsAuthConfigured,
  PROJECTS_SESSION_COOKIE,
  PROJECTS_SESSION_MAX_AGE,
  verifyProjectsPassword,
} from "@/lib/projects-auth";

export const dynamic = "force-dynamic";

function loginUrl(request: Request, error: string) {
  const url = new URL("/projects/login", request.url);
  url.searchParams.set("error", error);
  return url;
}

function redirectToLogin(request: Request, error: string) {
  const target = loginUrl(request, error);
  const response = new NextResponse(null, { status: 303, headers: { Location: target.pathname + target.search } });
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}

export async function POST(request: Request) {
  if (!isProjectsAuthConfigured()) {
    return redirectToLogin(request, "configuration");
  }

  const formData = await request.formData();
  const password = formData.get("password");

  if (
    typeof password !== "string" ||
    password.length > 256 ||
    !verifyProjectsPassword(password)
  ) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return redirectToLogin(request, "invalid");
  }

  const response = new NextResponse(null, { status: 303, headers: { Location: "/projects" } });
  response.cookies.set({
    name: PROJECTS_SESSION_COOKIE,
    value: createProjectsSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/projects",
    maxAge: PROJECTS_SESSION_MAX_AGE,
  });
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
