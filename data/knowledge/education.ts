import type { KnowledgeRecord } from "./types";

export const education: KnowledgeRecord[] = [
  { id:"edu-yandex-product", category:"education", title:"Product Management — Advanced Professional Retraining Program", organization:"Yandex Practicum", period:{from:"2025-08",to:"2026-07"}, summary:"Completed an intensive 12-month advanced professional retraining program in Product Management, designed for professionals with an existing higher education degree. Specialized in Digital Product Management, covering the full digital product lifecycle from market research and opportunity identification to strategy, development, launch, and continuous optimization.", facts:["Duration: 12 months.","Education level: Postgraduate Professional Retraining (Bachelor's-Level Curriculum). This describes the curriculum level, not the award of a bachelor's or postgraduate academic degree.","Entry requirement: Completed Higher Education Degree.","The curriculum combined product management methodologies, business strategy, UX/UI principles, data analytics, and Agile development practices with hands-on projects and real-world business cases.","Practical work included product development projects, hypothesis validation, customer research, and data-driven product decisions.","Built upon existing higher education in Economics and Enterprise Management, strengthening digital product development, strategic product leadership, and cross-functional collaboration."], skills:["Product Management","Product Discovery","Product Strategy","Product Analytics","SQL","UX/UI","Agile","Unit Economics"], tags:["yandex practicum","education","product management","diploma","professional retraining"], evidence:[{kind:"linkedin-profile-pdf",label:"LinkedIn profile PDF, education",locator:"page 9",verified:true},{kind:"owner-provided",label:"Owner-provided program description, November 2026",verified:true}], confidence:"high", public:true },
  { id:"edu-minsk-economics", category:"education", title:"Economics and Enterprise Management", organization:"Minsk Innovation University (MIU), Belarus", period:{from:"2000-09",to:"2006-06"}, summary:"Completed a degree program in Economics and Enterprise Management, combining economic analysis, business administration, strategic planning, and organizational management.", facts:["Qualification: Economist-Manager.","The program provided a strong foundation in financial management, business operations, marketing, resource allocation, and economic decision-making, with a focus on improving organizational efficiency and business performance.","This education established a foundation for professional development in product management, business strategy, process optimization, and cross-functional leadership."], skills:["Economics","Enterprise Management","Financial Analysis","Strategic Planning","Business Management"], tags:["degree","economics","management","university","economist-manager"], evidence:[{kind:"linkedin-profile-pdf",label:"LinkedIn profile PDF, education",locator:"page 9",verified:true},{kind:"owner-provided",label:"Owner-provided university program description, November 2026",verified:true}], confidence:"high", public:true },
];

export const economicsProgram = {
  qualification: "Economist-Manager",
  overview: "The program provided a strong foundation in financial management, business operations, marketing, resource allocation, and economic decision-making, with a focus on improving organizational efficiency and business performance.",
  areas: [
    "Strategic and Operational Management",
    "Business Economics and Financial Analysis",
    "Business Planning and Development",
    "Organizational Management and Leadership",
    "Marketing and Market Analysis",
    "Financial Planning and Budgeting",
    "Production and Resource Management",
    "Business Process Optimization",
    "Economic Analysis and Decision-Making",
  ],
  outcome: "This education established a foundation for my professional development in product management, business strategy, process optimization, and cross-functional leadership.",
};

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
