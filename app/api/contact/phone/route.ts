import { contactJson, contactRateLimit, validContactOrigin } from "@/lib/contact";

export async function POST(request: Request) {
  if (!validContactOrigin(request)) return contactJson({ error: "Request not allowed." }, 403);
  try {
    if (!await contactRateLimit(request, "phone")) return contactJson({ error: "Please try again later." }, 429);
    const phone = process.env.CONTACT_PHONE;
    if (!phone) return contactJson({ error: "Please contact me by email." }, 503);
    return contactJson({ phone });
  } catch {
    return contactJson({ error: "Please contact me by email." }, 503);
  }
}
