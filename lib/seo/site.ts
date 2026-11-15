import type { Metadata } from "next";

export const SITE_URL = "https://adamwisher.com";
export const STATIC_PAGES: Record<string, {title:string;description:string}> = {
  "/": {
    "title": "Adam Wisher — Product Manager",
    "description": "Adam Wisher is a Product Manager working across product strategy, AI, and connected systems."
  },
  "/about": {
    "title": "About — Adam Wisher",
    "description": "Adam Wisher's background in technology, mathematics, business leadership, product management, and digital transformation."
  },
  "/education": {
    "title": "Education & Training — Adam Wisher",
    "description": "Academic education, professional retraining, completed courses, and practical training across product management, AI, technology, and leadership."
  },
  "/work/single-source-of-truth": {
    "title": "Single Source of Truth — Adam Wisher",
    "description": "A company-wide synchronization initiative connecting product, sales, manufacturing, logistics, and engineering data into one unified ecosystem."
  },
  "/work/check2go": {
    "title": "Project №2 · Check2Go — Adam Wisher",
    "description": "A 0→1 TravelTech startup led end to end from idea to alpha for the U.S. market."
  },
  "/work/innova-knowledge-base": {
    "title": "Project №3 · INNOVA Knowledge & Training Ecosystem — Adam Wisher",
    "description": "A governed company knowledge ecosystem connecting support, onboarding, partner training, certification, and document standards."
  },
  "/work/business-systems-transformation": {
    "title": "Project №4 · Business Systems Transformation — Adam Wisher",
    "description": "A strategic evaluation and transformation roadmap spanning Salesforce, NetSuite, Slack, CPQ, and factory and vendor integrations."
  },
  "/work/ai-support-assistant": {
    "title": "Project №5 · AI Assistant for Technical & VIP Support — Adam Wisher",
    "description": "A grounded AI assistant connecting verified company knowledge, CRM product data, CPQ compatibility logic, and expert validation."
  },
  "/work/prescription-medication-marketplace": {
    "title": "Project №6 · Prescription Medication Marketplace — Adam Wisher",
    "description": "An anonymized healthcare product case study covering research, prescription verification, delivery, MVP strategy, analytics, experimentation, risk, and scaling."
  },
  "/contact": {
    "title": "Contact — Adam Wisher",
    "description": "Get in touch with Adam Wisher about product management, AI, digital products, and professional opportunities."
  },
  "/work": {
    "title": "Work — Adam Wisher",
    "description": "Product case studies across connected systems, AI, enterprise platforms, travel, and healthcare."
  }
};

// Canonicals never use request Host, forwarded headers, query strings or fragments.
export function canonicalUrl(path:string){return `${SITE_URL}${path}`;}
export function socialImageUrl(path:string){return `${SITE_URL}/og?path=${encodeURIComponent(path)}`;}
export const NOINDEX:Metadata={robots:{index:false,follow:false,nocache:true},alternates:{canonical:null},openGraph:null,twitter:null};
export function completeMetadata(path:string,defaults:Metadata):Metadata{
 const title=typeof defaults.title==='string'?defaults.title:'Adam Wisher';
 const description=defaults.description??STATIC_PAGES['/'].description;
 const ogTitle=defaults.openGraph?.title??title,ogDescription=defaults.openGraph?.description??description;
 const image={url:socialImageUrl(path),width:1200,height:630,type:'image/png',alt:typeof ogTitle==='string'?ogTitle:title};
 return {...defaults,metadataBase:new URL(SITE_URL),title,description,alternates:{...defaults.alternates,canonical:canonicalUrl(path)},
  robots:defaults.robots??{index:true,follow:true},
  openGraph:{...defaults.openGraph,type:'website',locale:'en_US',siteName:'Adam Wisher',url:canonicalUrl(path),title:ogTitle,description:ogDescription,images:[image]},
  twitter:{card:'summary_large_image',title:ogTitle,description:ogDescription,images:[{url:image.url,alt:image.alt}]}};
}
