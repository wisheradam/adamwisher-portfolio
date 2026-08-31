import type { KnowledgeRecord } from "./types";

export const profile: KnowledgeRecord[] = [
  {
    id: "profile-professional-summary",
    category: "profile",
    title: "Adam Wisher professional profile and experience",
    summary:
      "Adam Wisher is a product leader with more than 10 years of experience spanning digital products, product teams, business transformation, and product operations.",
    facts: [
      "Experience includes web and mobile products, B2B/B2C and DTC, CRM/ERP/CPQ, product data, automation, and AI-assisted products.",
      "Has founded and exited a B2B startup and held product and business leadership roles.",
      "Works from customer feedback, analytics, and measurable business outcomes.",
    ],
    skills: ["Product Leadership", "Product Strategy", "Product Operations", "Digital Transformation"],
    tags: ["adam wisher", "who is adam wisher", "about", "background", "profile", "summary", "experience", "10+ years", "head of product", "lead product manager"],
    evidence: [{ kind: "linkedin-profile-pdf", label: "LinkedIn profile PDF, summary", locator: "page 1", verified: true }],
    confidence: "high",
    public: true,
  },
  {
    id: "profile-industries",
    category: "profile",
    title: "Industries Adam has worked in",
    summary:
      "Adam's documented experience spans HVAC and manufacturing, travel technology, consumer goods and e-commerce, automotive, enterprise operations, and retail-network development.",
    tags: ["industries", "worked", "hvac", "manufacturing", "travel tech", "consumer goods", "ecommerce", "automotive", "enterprise", "retail"],
    evidence: [{ kind: "linkedin-profile-pdf", label: "LinkedIn profile PDF, experience", locator: "pages 2-9", verified: true }],
    confidence: "high",
    public: true,
  },
  {
    id: "profile-career-overview",
    category: "profile",
    title: "Career progression and startup background",
    summary:
      "Adam began his documented career in retail-network development at Eurotorg in 2008, progressed through business and executive leadership roles at ZIKO, Belagro, and Atlant-M, then moved into Product Manager and Senior Product Manager roles at Clean Cup and Check2Go before leading Product Management at INNOVA.",
    facts: [
      "His LinkedIn profile states that he founded and successfully exited a B2B startup.",
      "His current documented work is product leadership at INNOVA.",
    ],
    tags: ["career", "career progression", "started career", "first role", "startup", "founder", "founded", "exit", "eurotorg"],
    evidence: [{ kind: "linkedin-profile-pdf", label: "LinkedIn profile PDF, summary and experience", locator: "pages 1-9", verified: true }],
    confidence: "high",
    public: true,
  },
];
