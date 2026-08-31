import "server-only";
import { achievements } from "./achievements";
import { certifications } from "./certifications";
import { education } from "./education";
import { experience } from "./experience";
import { profile } from "./profile";
import { projects } from "./projects";
import { skills } from "./skills";
import type { KnowledgeRecord } from "./types";

export const knowledgeBase: readonly KnowledgeRecord[] = [
  ...profile, ...experience, ...education, ...certifications, ...skills, ...achievements, ...projects,
].filter((record) => record.public);

export type { KnowledgeRecord, RetrievedRecord, KnowledgeCategory } from "./types";
