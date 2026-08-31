import { NextRequest, NextResponse } from "next/server";
import type {
  AskAdamRequest,
  AskAdamResponse,
  AskAdamErrorResponse,
} from "@/types/ask-adam";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { answerWithConfiguredLlm, buildFallbackAnswer, hasSufficientEvidence } from "@/lib/knowledge/answer";

export const runtime = "nodejs";
const MAX_QUESTION_LENGTH = 500;

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

  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json<AskAdamErrorResponse>({ error: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.` }, { status: 400 });
  }

  const validHistory = !body.history || (Array.isArray(body.history) && body.history.length <= 20 && body.history.every((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string"));
  if (!validHistory) {
    return NextResponse.json<AskAdamErrorResponse>({ error: "Conversation history is invalid or too long." }, { status: 400 });
  }

  const records = retrieveKnowledge(question, { limit: 6 });
  let answer: string | null = null;
  if (hasSufficientEvidence(records)) {
    try { answer = await answerWithConfiguredLlm(question, records, body.history); } catch { /* Preserve availability without leaking provider details. */ }
  }
  const response: AskAdamResponse = {
    answer: answer ?? buildFallbackAnswer(question, records),
    sources: records.slice(0,4).map(({id,title,category}) => ({id,title,category})),
  };

  return NextResponse.json(response, { status: 200 });
}
