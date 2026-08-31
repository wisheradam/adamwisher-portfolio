export type KnowledgeCategory =
  | "profile"
  | "experience"
  | "education"
  | "certification"
  | "skill"
  | "achievement"
  | "project";

export type EvidenceKind =
  | "linkedin-profile-pdf"
  | "linkedin-learning-record"
  | "certificate-image"
  | "owner-provided";

export interface Evidence {
  kind: EvidenceKind;
  label: string;
  locator?: string;
  verified: boolean;
}

export interface KnowledgeRecord {
  id: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  facts?: string[];
  period?: { from?: string; to?: string };
  organization?: string;
  location?: string;
  skills?: string[];
  tags: string[];
  relatedIds?: string[];
  evidence: Evidence[];
  confidence: "high" | "medium";
  public: boolean;
}

export interface RetrievedRecord extends KnowledgeRecord {
  score: number;
  matchedTerms: string[];
}
