import "server-only";
import { createHash } from "node:crypto";
import { store } from "./db";
import { experience } from "@/data/knowledge/experience";
import { education } from "@/data/knowledge/education";
import { certifications } from "@/data/knowledge/certifications";
import type { KnowledgeRecord } from "@/data/knowledge/types";
const sources={experience,education,certifications};
function stableId(id:string){const h=createHash("sha256").update(`adamwisher:knowledge:${id}`).digest("hex");return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
export function knowledgeFingerprint(){return createHash("sha256").update(Object.values(sources).flat().filter(r=>r.public).map(r=>r.id).join("\n")).digest("hex");}
export function knowledgeCutover(){const sha=process.env.PUBLIC_KNOWLEDGE_CUTOVER_SHA;return Boolean(sha&&sha===knowledgeFingerprint());}
export async function publicKnowledge(kind:keyof typeof sources):Promise<KnowledgeRecord[]>{
 if(!knowledgeCutover())return sources[kind].filter(r=>r.public);
 const table={experience:"experience",education:"education_records",certifications:"certifications"}[kind];
 const rows=await store.query(`SELECT * FROM ${table} WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC`);
 const originals=new Map(sources[kind].map(r=>[stableId(r.id),r]));
 return rows.map(row=>{
  const original=originals.get(String(row.id));const name=kind==="experience"?row.company:kind==="education"?row.institution:row.issuer;
  const title=kind==="education"?row.program:row.title;
  return {id:original?.id??String(row.id),learningType:kind==="certifications"?(String(row.credential_type??"Other learning activity") as KnowledgeRecord["learningType"]):undefined,credentialUrl:row.credential_url?String(row.credential_url):undefined,category:kind==="certifications"?"certification":kind,title:String(title),organization:String(name),summary:String(row.description??""),period:{from:String(row.start_date??""),to:String(row.end_date??row.completion_date??"")},skills:original?.skills??(row.skills?String(row.skills).split(", "):[]),tags:original?.tags??[],evidence:original?.evidence??[],confidence:original?.confidence??"high",public:true} as KnowledgeRecord;
 });
}
