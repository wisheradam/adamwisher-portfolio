import "server-only";
import type { AskAdamMessage } from "@/types/ask-adam";
import type { RetrievedRecord } from "@/data/knowledge";
import { formatKnowledgeContext } from "./retrieve";

const SYSTEM_PROMPT = `You are Ask Adam, the factual assistant on Adam Wisher's public portfolio.
Answer only from the supplied KNOWLEDGE CONTEXT. Be concise, natural, and specific.
Never reveal private contact information or identity aliases. Never infer a certification from training.
In particular, AWS CLF-C02 records are cert-prep courses, not an AWS certification. Practical AWS Bedrock work may be described as experience.
If the context does not clearly and directly support an answer, do not guess or try to be helpful by inference. Say: "I don't have enough verified information to answer that confidently. You can ask Adam directly for confirmation."
If only part of the question is supported, answer that part, clearly identify what is not documented, and suggest asking Adam directly about the missing part.
Do not invent dates, metrics, employers, credentials, project details, or contact details.`;

export const INSUFFICIENT_INFORMATION_ANSWER =
  "I don't have enough verified information to answer that confidently. You can ask Adam directly for confirmation.";

export function hasSufficientEvidence(records: RetrievedRecord[]) {
  if (!records.length) return false;
  const [best] = records;
  return best.score >= 8 && best.matchedTerms.length >= 1;
}

function safeHistory(history: AskAdamMessage[] = []) {
  return history.slice(-4).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({role:m.role,content:m.content.slice(0,1000)}));
}

export async function answerWithConfiguredLlm(question: string, records: RetrievedRecord[], history?: AskAdamMessage[]) {
  const endpoint = process.env.ASK_ADAM_LLM_ENDPOINT;
  const apiKey = process.env.ASK_ADAM_LLM_API_KEY;
  const model = process.env.ASK_ADAM_LLM_MODEL;
  if (!endpoint || !apiKey || !model) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method:"POST", signal:controller.signal,
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`},
      body:JSON.stringify({model,temperature:0.2,max_tokens:450,messages:[{role:"system",content:SYSTEM_PROMPT},...safeHistory(history),{role:"user",content:`KNOWLEDGE CONTEXT\n${formatKnowledgeContext(records)}\n\nQUESTION\n${question}`}]}),
    });
    if (!response.ok) throw new Error(`LLM request failed with status ${response.status}`);
    const json = await response.json() as {choices?:Array<{message?:{content?:string}}>};
    return json.choices?.[0]?.message?.content?.trim() || null;
  } finally { clearTimeout(timeout); }
}

function clean(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function buildFallbackAnswer(question: string, records: RetrievedRecord[]) {
  if (!hasSufficientEvidence(records)) return INSUFFICIENT_INFORMATION_ANSWER;

  const query = clean(question);
  const asksAboutAwsCertification = query.includes("aws") && (query.includes("certif") || query.includes("credential"));
  if (asksAboutAwsCertification) {
    const hasBedrockExperience = records.some((record) => record.skills?.includes("AWS Bedrock"));
    return `No — the available evidence does not show that Adam holds an AWS certification. He completed all four LinkedIn Learning preparation courses for AWS Certified Cloud Practitioner (CLF-C02), but cert-prep training is not the certification itself.${hasBedrockExperience ? " Separately, his professional record documents hands-on AWS Bedrock work on an AI-powered Product Assistant at INNOVA." : ""}`;
  }

  const asksAboutAi = query.includes(" ai ") || query.startsWith("ai ") || query.endsWith(" ai") || query.includes("artificial intelligence") || query.includes("llm") || query.includes("generative") || query.includes("искусственн");
  if (asksAboutAi) {
    return "Adam combines practical AI product work with business-focused AI training. At INNOVA, he leads an AI-powered Product Assistant using AWS Bedrock and knowledge-management foundations within a wider CRM, ERP, and product-data ecosystem. His training includes Generative AI for Business Leaders and Generative AI for Project Management, plus foundational Python study. This supports a product-leadership profile with hands-on AI implementation experience — not a claim of AWS certification.";
  }

  const asksAboutStrongestSkills = query.includes("strongest skill") || query.includes("top skill") || query.includes("сильн") || query.includes("навык");
  if (asksAboutStrongestSkills) {
    return "Adam's strongest areas are product strategy and leadership, building web and mobile products, product operations, and complex enterprise integrations across CRM, ERP, CPQ, and product data. He also has strong growth experience in discovery, analytics, experimentation, conversion, and automation, complemented by practical AI product work with AWS Bedrock.";
  }

  const asksAboutProjects = query.includes("project") || query.includes("case stud") || query.includes("проект");
  if (asksAboutProjects) {
    return "The strongest projects to review are: INNOVA's AWS Bedrock-powered Product Assistant; INNOVA's unified product-data ecosystem connecting CRM, ERP, SOLIDWORKS, and OpenBOM; Clean Cup's global e-commerce and iOS/Android ecosystem, which helped double B2C revenue and cut operating costs by 14%; and Check2Go, where Adam led strategy and a cross-functional team of eight in travel tech.";
  }

  const asksAboutTechnical = query.includes("technical") || query.includes("technology") || query.includes("техническ") || query.includes("технолог");
  if (asksAboutTechnical) {
    return "Adam's technical background is product-led rather than software-engineering-led. He has delivered web, e-commerce, and iOS/Android products; payment APIs; Salesforce, Zoho, Bitrix24, SAP, ERPNext, CPQ, OpenBOM, and SOLIDWORKS integrations; product-data architecture and workflow automation; and an AWS Bedrock-powered AI assistant. He has also completed foundational Python training with 112 lessons and 69 practical cases.";
  }

  const unique: RetrievedRecord[] = [];
  for (const record of records) {
    const signature = clean(record.title).replace(/part [1-4]$/, "");
    if (!unique.some((item) => clean(item.title).replace(/part [1-4]$/, "") === signature)) unique.push(record);
  }

  const lead = unique[0];
  const supporting = unique.slice(1, 3);
  if (!supporting.length) return `${lead.title}${lead.organization ? ` at ${lead.organization}` : ""}: ${lead.summary}`;
  return `${lead.summary} Related documented evidence includes ${supporting.map((record) => `${record.title}${record.organization ? ` at ${record.organization}` : ""}`).join(" and ")}.`;
}
