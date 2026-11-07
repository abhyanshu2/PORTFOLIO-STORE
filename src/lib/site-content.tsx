import { Fragment, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type SiteContent = {
  nav: { logo: string; storeButton: string };
  hero: {
    badge: string;
    number: string;
    firstName: string;
    lastName: string;
    wallLetter: string;
    roles: string[];
    description: string;
    primaryButton: string;
    storeButton: string;
  };
  marquee: string[];
  about: {
    label: string;
    titleTop: string;
    titleBottom: string;
    titleEm: string;
    stats: { num: string; label: string }[];
    paragraphs: string[];
  };
  skills: {
    label: string;
    titleTop: string;
    titleBottom: string;
    description: string;
    groups: { label: string; tags: string[] }[];
  };
  projects: { label: string; titleTop: string; titleEm: string; githubUrl: string; allButton: string };
  education: {
    label: string;
    titleTop: string;
    titleEm: string;
    items: { year: string; degree: string; note: string; school: string; score: string }[];
  };
  contact: {
    label: string;
    heading: string;
    text: string;
    email: string;
    city: string;
    resumeUrl: string;
    linkedinUrl: string;
    socials: { label: string; href: string }[];
    availableTitle: string;
    availableText: string;
    availableTags: string;
    closingTitle: string;
    resumeButton: string;
    linkedinButton: string;
    footerName: string;
  };
  store: {
    logo: string;
    logoSub: string;
    eyebrow: string;
    titleTop: string;
    titleEm: string;
    description: string;
    browseButton: string;
    whatsappButton: string;
    whatsappNumber: string;
    contacts: { label: string; value: string; href: string }[];
    sections: Record<
      "templates" | "products" | "resources" | "services" | "contact",
      { label: string; top: string; em: string }
    >;
    footer: string;
  };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  nav: { logo: "Abhyanshu", storeButton: "Visit Store ↗" },
  hero: {
    badge: "OPEN TO OPPORTUNITIES",
    number: "01 INTRODUCTION",
    firstName: "ABHYANSHU",
    lastName: "Raj",
    wallLetter: "S",
    roles: ["Frontend Developer", "Backend Developer", "Web Developer", "Full Stack Developer"],
    description:
      "**Building pixel-perfect interfaces** with modern web technologies. Passionate about React, Next.js & creating experiences that feel intentional. Based in **Vaishali, Bihar**.",
    primaryButton: "View My Work",
    storeButton: "Visit Store ↗",
  },
  marquee: ["React", "Next.js 15", "TypeScript", "Node.js", "Tailwind CSS", "MongoDB", "Framer Motion", "Git / GitHub"],
  about: {
    label: "01 about",
    titleTop: "WHO",
    titleBottom: "I",
    titleEm: "AM.",
    stats: [
      { num: "2+", label: "Years Learning" },
      { num: "4+", label: "Projects Built" },
      { num: "10+", label: "Tech Stack" },
      { num: "∞", label: "Curiosity" },
    ],
    paragraphs: [
      "I'm a **Diploma student in Computer Science & Engineering** currently in my 4th semester. What started with HTML and CSS turned into a full-stack rabbit hole: React, Next.js, Node.js, MongoDB, and shipping real interfaces that feel intentional.",
      "Passionate about **clean UI, modern design systems**, and building things that actually work. Exploring Framer Motion, TypeScript, and scalable backend architectures.",
      "When I'm not coding, I'm **watching tech YouTube**, exploring new gadgets, or travelling. Based in **Vaishali, Bihar**, available for remote & freelance opportunities.",
    ],
  },
  skills: {
    label: "02 skills",
    titleTop: "MY",
    titleBottom: "TOOLKIT",
    description: "Things I build with daily, growing in, and rely on to design, ship, and iterate.",
    groups: [
      { label: "Frontend", tags: ["Next.js 15", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "HTML5", "CSS3 / SCSS", "JavaScript ES6+"] },
      { label: "Backend", tags: ["Node.js", "Express.js", "MongoDB", "Mongoose", "REST API", "JWT Auth"] },
      { label: "Tools & Deployment", tags: ["Git / GitHub", "VS Code", "Vercel", "Netlify", "Render", "Postman", "Turborepo", "npm Workspaces"] },
      { label: "Languages", tags: ["Hindi", "English"] },
    ],
  },
  projects: {
    label: "03 projects",
    titleTop: "SELECTED",
    titleEm: "Work",
    githubUrl: "https://github.com/abhyanshu2",
    allButton: "View All on GitHub ↗",
  },
  education: {
    label: "05 education",
    titleTop: "LEARNING",
    titleEm: "Path",
    items: [
      { year: "2023 - NOW", degree: "Diploma in Computer Science & Engg", note: "Currently in 4th Semester", school: "Pursuing Diploma", score: "In Progress" },
      { year: "2023", degree: "12th Science (BSEB)", note: "", school: "Akshyawat College Mahua, Vaishali", score: "60%" },
      { year: "2021", degree: "10th CBSE", note: "", school: "Delhi Public School International, Muzaffarpur", score: "80%" },
    ],
  },
  contact: {
    label: "06 contact",
    heading: "Let's Work Together",
    text: "Open to full-stack internships, frontend roles, freelance UI/UX work and collaborations.",
    email: "abhyanshu2@gmail.com",
    city: "Vaishali, India",
    resumeUrl: "/resume.pdf",
    linkedinUrl: "https://linkedin.com/in/abhyanshu",
    socials: [
      { label: "GitHub", href: "https://github.com/abhyanshu2" },
      { label: "LinkedIn", href: "https://linkedin.com/in/abhyanshu" },
      { label: "Instagram", href: "https://instagram.com/_abhyanshu" },
      { label: "WhatsApp", href: "https://wa.me/916206358342" },
    ],
    availableTitle: "Open to new opportunities",
    availableText: "Available",
    availableTags: "Full-Stack Internships · Frontend Roles · Freelance UI/UX",
    closingTitle: "Open to Frontend / Full-Stack Roles",
    resumeButton: "View Resume ↗",
    linkedinButton: "LinkedIn ↗",
    footerName: "Abhyanshu Raj",
  },
  store: {
    logo: "Store",
    logoSub: "by Abhyanshu",
    eyebrow: "Digital marketplace",
    titleTop: "Premium",
    titleEm: "Templates",
    description:
      "Handcrafted templates, apps and free resources for moments that matter. Pick what you like and buy directly on WhatsApp.",
    browseButton: "Browse templates ↓",
    whatsappButton: "Chat on WhatsApp ↗",
    whatsappNumber: "916206358342",
    contacts: [
      { label: "WhatsApp", value: "+91 6206358342", href: "https://wa.me/916206358342" },
      { label: "Email", value: "abhyanshu2@gmail.com", href: "mailto:abhyanshu2@gmail.com" },
      { label: "GitHub", value: "github.com/abhyanshu2", href: "https://github.com/abhyanshu2" },
      { label: "LinkedIn", value: "linkedin.com/in/abhyanshu", href: "https://linkedin.com/in/abhyanshu" },
    ],
    sections: {
      templates: { label: "Browse catalog", top: "All", em: "Templates" },
      products: { label: "Built by me", top: "My", em: "Products" },
      resources: { label: "Free downloads", top: "Free", em: "Resources" },
      services: { label: "Hire me", top: "My", em: "Services" },
      contact: { label: "Get in touch", top: "Let's", em: "Connect" },
    },
    footer: "© {year} Abhyanshu Raj · Digital Store · Powered by WhatsApp",
  },
};

function merge<T>(base: T, saved: unknown): T {
  if (saved === undefined || saved === null) return base;
  if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T;
  if (base && typeof base === "object") {
    const s = (typeof saved === "object" ? saved : {}) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(base as object)) {
      out[k] = merge((base as Record<string, unknown>)[k], s[k]);
    }
    return out as T;
  }
  return (typeof saved === typeof base ? saved : base) as T;
}

export function mergeSiteContent(saved: unknown): SiteContent {
  return merge(DEFAULT_SITE_CONTENT, saved);
}

let cache: SiteContent | null = null;
let inflight: Promise<SiteContent> | null = null;

export function loadSiteContent(force = false): Promise<SiteContent> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = Promise.resolve(supabase.from("site_content").select("data").eq("id", 1).maybeSingle())
    .then(({ data, error }) => {
      cache = !error && data ? mergeSiteContent(data.data) : DEFAULT_SITE_CONTENT;
      return cache;
    })
    .catch(() => (cache = DEFAULT_SITE_CONTENT))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function setSiteContentCache(c: SiteContent) {
  cache = c;
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cache ?? DEFAULT_SITE_CONTENT);
  useEffect(() => {
    let cancelled = false;
    loadSiteContent().then((c) => {
      if (!cancelled) setContent(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return content;
}

export function rich(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}