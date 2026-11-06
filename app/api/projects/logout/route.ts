import { NextResponse } from "next/server";
import { PROJECTS_SESSION_COOKIE } from "@/lib/projects-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/projects/login", request.url), 303);
  response.cookies.set({
    name: PROJECTS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/projects",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
