import { NextRequest, NextResponse } from "next/server";
import type {
  AskAdamRequest,
  AskAdamResponse,
  AskAdamErrorResponse,
} from "@/types/ask-adam";

// TODO(ask-adam-backend): wire this up to the real pipeline:
//   Browser -> /api/ask-adam -> server-side call -> Amazon Bedrock -> Adam's
//   knowledge base -> response.
//
// This route is intentionally a stub. It validates the request shape and
// returns a clearly-labeled placeholder answer so the frontend has a real
// endpoint to integrate against. No AI provider is called here, and no
// provider API key is read or exposed. Do not add a client-side call to
// any AI provider's API from this project — everything must go through
// this server route.

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: AskAdamRequest;

  try {
    body = (await req.json()) as AskAdamRequest;
  } catch {
    return NextResponse.json<AskAdamErrorResponse>(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const question = body?.question?.trim();

  if (!question) {
    return NextResponse.json<AskAdamErrorResponse>(
      { error: "A question is required." },
      { status: 400 }
    );
  }

  // TODO(ask-adam-backend): replace this stub with a call into the real
  // model/knowledge-base pipeline. Keep all provider credentials in
  // server-only environment variables (see .env.example) and never return
  // them, log them, or forward them to the client.
  const response: AskAdamResponse = {
    answer:
      "Ask Adam isn't connected to a live knowledge base yet — this endpoint is a working stub. Once the Bedrock-backed pipeline is wired up, this will answer with real detail about Adam's background.",
  };

  return NextResponse.json(response, { status: 200 });
}
