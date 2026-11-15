import type { ProjectVisualKind } from "@/components/work/project-visual";

export type PublicCaseStudy={title:string;category:string;summary:string;role:string;href:string;visual?:ProjectVisualKind;visualSrc?:string};
// Existing, source-controlled public case studies. Protected workspace data is never imported.
export const PUBLIC_CASE_STUDIES: readonly PublicCaseStudy[] = [
  {
    "title": "Single Source of Truth",
    "category": "Systems · Data · Operations",
    "summary": "A company-wide synchronization initiative connecting product, sales, manufacturing, logistics, and engineering data.",
    "role": "Product leadership",
    "href": "/work/single-source-of-truth",
    "visual": "ssot"
  },
  {
    "title": "Check2Go",
    "category": "TravelTech · 0→1 · USA",
    "summary": "A travel startup led end to end—from the first concept and team build to alpha, localization, and investor readiness.",
    "role": "Product Lead · Project Owner",
    "href": "/work/check2go",
    "visual": "check2go"
  },
  {
    "title": "INNOVA Knowledge & Training Ecosystem",
    "category": "Knowledge · Enablement · Governance",
    "summary": "A governed company knowledge system for support, onboarding, partner training, certification, and document standards.",
    "role": "Product Lead",
    "href": "/work/innova-knowledge-base",
    "visual": "knowledge"
  },
  {
    "title": "Business Systems Transformation",
    "category": "Enterprise · CPQ · Architecture",
    "summary": "A research-led roadmap from Zoho to Salesforce, NetSuite, and Slack, with CPQ and connected operations at the center.",
    "role": "Product Lead",
    "href": "/work/business-systems-transformation",
    "visual": "transformation"
  },
  {
    "title": "AI Assistant for Technical & VIP Support",
    "category": "AI · CRM · CPQ · Support",
    "summary": "A grounded, multi-source assistant connecting verified company knowledge with product data, compatibility logic, and ordering workflows.",
    "role": "Product Lead · AI Product Owner",
    "href": "/work/ai-support-assistant",
    "visual": "ai-support"
  },
  {
    "title": "Healthcare Marketplace: Prescription Medication Sales & Delivery",
    "category": "Healthcare · Marketplace · NDA",
    "summary": "A full-cycle product case for prescription search, verification, checkout, secure delivery, repeat medication management, and scalable automation.",
    "role": "Product Manager · End-to-end",
    "href": "/work/prescription-medication-marketplace",
    "visualSrc": "/project-06-rx.svg"
  }
];
