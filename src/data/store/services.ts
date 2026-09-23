export type Service = { id: string; name: string; description: string; price: string; features: string[] };
export const SERVICES: Service[] = [
  { id: "portfolio-dev", name: "Portfolio Development", description: "Editorial-grade portfolio with animations and CMS-ready structure.", price: "from ₹4,999", features: ["Custom design", "Responsive", "SEO", "1 month support"] },
  { id: "landing-dev", name: "Landing Page Development", description: "Conversion-focused landing page tailored to your product.", price: "from ₹6,999", features: ["Copy assist", "A/B ready", "Analytics", "Fast load"] },
  { id: "business-site", name: "Business Website", description: "Multi-page business website with services, blog and contact.", price: "from ₹12,999", features: ["Up to 8 pages", "CMS", "Contact forms", "SEO"] },
  { id: "react-dev", name: "React Development", description: "Custom React apps, dashboards, or SaaS front-ends.", price: "hourly / project", features: ["React", "TypeScript", "Testing", "Deploy"] },
  { id: "ux-design", name: "UI/UX Design", description: "Figma design systems, wireframes and hi-fi prototypes.", price: "from ₹5,999", features: ["Wireframes", "Prototypes", "Design system", "Handoff"] },
  { id: "redesign", name: "Website Redesign", description: "Rebrand or modernize an existing website.", price: "from ₹8,999", features: ["Audit", "New design", "Migration", "Launch"] },
  { id: "bug-fix", name: "Bug Fixing", description: "Debug and fix issues on your existing site or app.", price: "hourly", features: ["Diagnosis", "Fix", "Tests", "Report"] },
  { id: "maintenance", name: "Website Maintenance", description: "Monthly maintenance, updates, backups and monitoring.", price: "from ₹1,999/mo", features: ["Updates", "Backups", "Monitoring", "Support"] },
];
