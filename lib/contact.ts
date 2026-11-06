import { createHash } from "node:crypto";
import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "eu-north-1", maxAttempts: 2 });
const table = "adamwisher-contact-limits";

export function validContactOrigin(request: Request) {
  return request.headers.get("origin") === "https://adamwisher.com";
}

export async function contactRateLimit(request: Request, action: "message" | "phone") {
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const digest = createHash("sha256").update(`${Math.floor(now / 86400)}:${ip}`).digest("hex");
  const entries = [
    { key: `${action}:ip:${digest}:${Math.floor(now / 3600)}`, limit: action === "message" ? 3 : 10 },
    { key: `${action}:day:${Math.floor(now / 86400)}`, limit: action === "message" ? 100 : 1000 },
  ];
  try {
    await db.send(new TransactWriteItemsCommand({
      TransactItems: entries.map(({ key, limit }) => ({ Update: {
        TableName: table,
        Key: { id: { S: key } },
        UpdateExpression: "SET #count = if_not_exists(#count, :zero) + :one, expiresAt = :ttl",
        ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
        ExpressionAttributeNames: { "#count": "count" },
        ExpressionAttributeValues: { ":zero": { N: "0" }, ":one": { N: "1" }, ":limit": { N: String(limit) }, ":ttl": { N: String(now + 172800) } },
      } })),
    }));
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "TransactionCanceledException") return false;
    throw error;
  }
}

export function contactJson(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" } });
}
