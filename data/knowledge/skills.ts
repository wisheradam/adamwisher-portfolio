import type { KnowledgeRecord } from "./types";
const groups = [
  ["skill-product","Product management and leadership",["Product Strategy","Roadmaps","Discovery","Prioritization","Product Operations","Product Lifecycle Management"],["product manager","product leadership","roadmap","discovery"]],
  ["skill-growth","Growth and experimentation",["Product Analytics","User Behavior Analysis","Funnels","Conversion","Retention","A/B Testing"],["growth","analytics","experiments","metrics"]],
  ["skill-digital","Digital products",["Web Products","E-commerce","iOS and Android Apps","Payments APIs"],["web","mobile","ecommerce","apps"]],
  ["skill-enterprise","Enterprise systems and automation",["Salesforce","Zoho CRM","Bitrix24","SAP","ERPNext","CPQ","OpenBOM","SOLIDWORKS","Business Process Automation"],["crm","erp","cpq","pdm","automation"]],
  ["skill-ai","AI and technical",["AWS Bedrock","AI Product Assistant","Knowledge Management","Python Fundamentals"],["ai","llm","agents","aws bedrock","python"]],
  ["skill-leadership","Leadership and business",["Cross-functional Leadership","Team Leadership","Go-to-Market","Negotiation","Risk Management","Financial Modeling"],["leadership","management","business","communication"]],
] as const;
export const skills: KnowledgeRecord[] = groups.map(([id,title,list,tags]) => ({id,category:"skill",title,summary:`Demonstrated skill group: ${list.join(", ")}.`,skills:[...list],tags:[...tags,...list.map((x)=>x.toLowerCase())],evidence:[{kind:"linkedin-profile-pdf",label:"LinkedIn profile PDF, summary and experience",locator:"pages 1-9",verified:true}],confidence:"high",public:true}));
