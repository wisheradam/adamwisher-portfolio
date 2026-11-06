import type { KnowledgeRecord } from "./types";

export const education: KnowledgeRecord[] = [
  { id:"edu-yandex-product", category:"education", title:"Product Management — Advanced Professional Retraining Program", organization:"Yandex Practicum", period:{from:"2025-08",to:"2026-07"}, summary:"Completed an intensive 12-month advanced professional retraining program in Product Management, designed for professionals with an existing higher education degree. Specialized in Digital Product Management, covering the full digital product lifecycle from market research and opportunity identification to strategy, development, launch, and continuous optimization.", facts:["Duration: 12 months.","Education level: Postgraduate Professional Retraining (Bachelor's-Level Curriculum). This describes the curriculum level, not the award of a bachelor's or postgraduate academic degree.","Entry requirement: Completed Higher Education Degree.","The curriculum combined product management methodologies, business strategy, UX/UI principles, data analytics, and Agile development practices with hands-on projects and real-world business cases.","Practical work included product development projects, hypothesis validation, customer research, and data-driven product decisions.","Built upon existing higher education in Economics and Enterprise Management, strengthening digital product development, strategic product leadership, and cross-functional collaboration."], skills:["Product Management","Product Discovery","Product Strategy","Product Analytics","SQL","UX/UI","Agile","Unit Economics"], tags:["yandex practicum","education","product management","diploma","professional retraining"], evidence:[{kind:"linkedin-profile-pdf",label:"LinkedIn profile PDF, education",locator:"page 9",verified:true},{kind:"owner-provided",label:"Owner-provided program description, November 2026",verified:true}], confidence:"high", public:true },
  { id:"edu-minsk-economics", category:"education", title:"Master of Economics Degree - Economics and Enterprise Management", organization:"Minsk Innovation University", period:{from:"2000-09",to:"2006-06"}, summary:"Higher education in economics and enterprise management.", skills:["Economics","Enterprise Management","Business Management"], tags:["degree","economics","management","university"], evidence:[{kind:"linkedin-profile-pdf",label:"LinkedIn profile PDF, education",locator:"page 9",verified:true}], confidence:"high", public:true },
];

export const yandexProgram = {
  duration: "12 Months",
  educationLevel: "Postgraduate Professional Retraining (Bachelor's-Level Curriculum)",
  entryRequirement: "Completed Higher Education Degree",
  specialization: "Digital Product Management",
  overview: "The curriculum combined product management methodologies, business strategy, UX/UI principles, data analytics, and Agile development practices with hands-on projects and real-world business cases.",
  areas: [
    "Product Strategy and Roadmap Development",
    "Product Discovery and Customer Development",
    "Market Research and Competitive Analysis",
    "Product Lifecycle Management",
    "UX/UI Design Principles and Prototyping",
    "Agile, Scrum, and Cross-Functional Team Management",
    "Product Analytics, KPIs, and SQL",
    "A/B Testing and Data-Driven Decision-Making",
    "Product-Market Fit and MVP Development",
    "Product Marketing and Go-to-Market Strategy",
    "Prioritization, Backlog Management, and Stakeholder Communication",
    "Business Models, Monetization, and Unit Economics",
  ],
  practice: "The program emphasized practical experience through product development projects, hypothesis validation, customer research, and data-driven product decisions.",
  outcome: "This advanced professional retraining strengthened my expertise in digital product development, strategic product leadership, and cross-functional collaboration, building upon my existing higher education in Economics and Enterprise Management.",
};
