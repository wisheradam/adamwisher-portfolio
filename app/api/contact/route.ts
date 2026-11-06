import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { contactJson, contactRateLimit, validContactOrigin } from "@/lib/contact";

const mail = new SESv2Client({ region: "eu-central-1", maxAttempts: 1 });
const mailbox = "mail@adamwisher.com";

export async function POST(request: Request) {
  if (!validContactOrigin(request)) return contactJson({ error: "Request not allowed." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return contactJson({ error: "Invalid request." }, 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return contactJson({ error: "Invalid request." }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16000) { await reader.cancel(); return contactJson({ error: "Message is too long." }, 413); }
      chunks.push(value);
    }
    let data;
    try { data = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return contactJson({ error: "Invalid request." }, 400); }
    if (!data || typeof data !== "object") return contactJson({ error: "Invalid request." }, 400);
    if (data.website) return contactJson({ success: true });
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const message = typeof data.message === "string" ? data.message.trim() : "";
    const purpose = ["Project inquiry", "Professional opportunity", "Request a call", "Other"].includes(data.purpose) ? data.purpose : "Other";
    if (name.length < 2 || name.length > 100 || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n]/.test(email) || message.length < 10 || message.length > 5000 || data.consent !== true) {
      return contactJson({ error: "Please check your name, email, message, and consent." }, 400);
    }
    if (typeof data.startedAt !== "number" || Date.now() - data.startedAt < 2500) return contactJson({ error: "Please take a moment and try again." }, 400);
    if (!await contactRateLimit(request, "message")) return contactJson({ error: "Too many requests. Please try later or email me directly." }, 429);
    await mail.send(new SendEmailCommand({
      FromEmailAddress: `Adam Wisher Website <${mailbox}>`,
      Destination: { ToAddresses: [mailbox] },
      ReplyToAddresses: [email],
      Content: { Simple: {
        Subject: { Data: `Website contact: ${purpose}`, Charset: "UTF-8" },
        Body: { Text: { Data: `New request from adamwisher.com/contact\n\nName: ${name}\nEmail: ${email}\nRequest: ${purpose}\n\n${message}\n\nThe sender agreed to be contacted about this request.`, Charset: "UTF-8" } },
      } },
    }));
    return contactJson({ success: true });
  } catch {
    return contactJson({ error: "Your message could not be sent. Please email Mail@adamwisher.com or try again later." }, 503);
  }
}
