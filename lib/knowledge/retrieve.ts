import "server-only";
import { knowledgeBase, type KnowledgeCategory, type KnowledgeRecord, type RetrievedRecord } from "@/data/knowledge";

const STOP_WORDS = new Set(["a","an","and","are","about","adam","did","does","for","has","have","he","his","how","in","is","me","of","on","show","tell","the","to","what","which","with","you","your"]);
const SYNONYMS: Record<string,string[]> = {
  ai:["llm","agent","assistant","bedrock","generative"], llm:["ai","agent","bedrock"],
  aws:["bedrock","cloud"], product:["roadmap","discovery","strategy","prioritization"],
  results:["achievement","metric","revenue","cost","grew","reduced","doubled"],
  achievements:["results","metric","revenue","cost","grew","reduced","doubled"],
  technical:["ai","aws","python","crm","erp","api","integration","automation"],
  projects:["platform","ecosystem","assistant","implementation","launch"],
  strongest:["top","leading","project","skill"], career:["progression","background","experience","startup"],
  years:["experience","background"], industries:["industry","sector","hvac","travel","automotive","retail"],
  education:["degree","diploma","university","practicum"],
  certifications:["course","training","certificate","learning"],
  обучение:["education","course","training","certification"], опыт:["experience","background"],
  навыки:["skills","expertise"], проекты:["projects","platform","ecosystem"],
  достижения:["achievements","results","metric"], искусственный:["ai","llm"], интеллект:["ai","llm"],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/[^\p{L}\p{N}+#.%]+/gu, " ").trim();
}

function queryTerms(query: string) {
  const base = normalize(query).split(/\s+/).filter((term) => term.length > 1 && !STOP_WORDS.has(term));
  return [...new Set(base.flatMap((term) => [term, ...(SYNONYMS[term] ?? [])]))];
}

function fields(record: KnowledgeRecord) {
  return {
    title: normalize(record.title),
    tags: normalize([record.category, ...record.tags].join(" ")),
    skills: normalize(record.skills?.join(" ") ?? ""),
    body: normalize([record.summary, ...(record.facts ?? []), record.organization ?? ""].join(" ")),
  };
}

export function retrieveKnowledge(query: string, options: { limit?: number; categories?: KnowledgeCategory[] } = {}): RetrievedRecord[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  return knowledgeBase
    .filter((record) => !options.categories || options.categories.includes(record.category))
    .map((record) => {
      const text = fields(record);
      const matchedTerms = terms.filter((term) => Object.values(text).some((value) => value.includes(term)));
      let score = 0;
      for (const term of terms) {
        if (text.title.includes(term)) score += 8;
        if (text.tags.includes(term)) score += 5;
        if (text.skills.includes(term)) score += 4;
        if (text.body.includes(term)) score += 2;
      }
      if (normalize(record.title).includes(normalize(query))) score += 12;
      score *= record.confidence === "high" ? 1 : 0.8;
      return { ...record, score, matchedTerms };
    })
    .filter((record) => record.score > 0)
    .sort((a,b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, Math.min(options.limit ?? 6, 10));
}

export function formatKnowledgeContext(records: RetrievedRecord[], maxChars = 7500) {
  let output = "";
  for (const record of records) {
    const block = [
      `[${record.id}] ${record.category.toUpperCase()}: ${record.title}`,
      record.organization ? `Organization: ${record.organization}` : "",
      record.period ? `Period: ${record.period.from ?? ""} to ${record.period.to ?? ""}` : "",
      `Summary: ${record.summary}`,
      record.facts?.length ? `Verified facts: ${record.facts.join(" | ")}` : "",
      `Evidence: ${record.evidence.map((e) => `${e.label}${e.locator ? ` (${e.locator})` : ""}`).join("; ")}`,
    ].filter(Boolean).join("\n") + "\n\n";
    if (output.length + block.length > maxChars) break;
    output += block;
  }
  return output.trim();
}
