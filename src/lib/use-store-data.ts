import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { TEMPLATES, type Template } from "@/data/store/templates";
import { MY_PRODUCTS, type MyProduct } from "@/data/store/myProducts";
import { RESOURCES, type Resource } from "@/data/store/resources";
import { SERVICES, type Service } from "@/data/store/services";

/**
 * Generic fetch-with-fallback hook. If Supabase is unreachable, misconfigured,
 * or the table is empty, this silently keeps using the bundled static data —
 * the store never breaks or shows blank sections because of a backend hiccup.
 */
function useSupabaseTable<T>(table: string, orderBy: string, mapRow: (row: any) => T, fallback: T[]) {
  const [data, setData] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true })
      .then(({ data: rows, error }) => {
        if (cancelled) return;
        if (!error && rows && rows.length > 0) {
          setData(rows.map(mapRow));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return { data, loading };
}

export function useTemplates() {
  return useSupabaseTable<Template>(
    "templates",
    "sort_order",
    (r) => ({
      id: r.id,
      name: r.name,
      monogram: r.monogram,
      category: r.category,
      description: r.description,
      features: r.features ?? [],
      price: r.price,
      badge: r.badge || undefined,
      screenshots: r.screenshots ?? [],
      demoUrl: r.demo_url || undefined,
      cover: r.cover_image_url || undefined,
      images: r.gallery_image_urls?.length ? r.gallery_image_urls : undefined,
      videoUrl: r.video_url || undefined,
    }),
    TEMPLATES
  );
}

export function useMyProducts() {
  return useSupabaseTable<MyProduct>(
    "my_products",
    "sort_order",
    (r) => ({
      id: r.id,
      name: r.name,
      monogram: r.monogram,
      description: r.description,
      features: r.features ?? [],
      stack: r.stack ?? [],
      status: r.status,
      liveUrl: r.live_url || undefined,
      learnMoreUrl: r.learn_more_url || undefined,
    }),
    MY_PRODUCTS
  );
}

export function useResources() {
  return useSupabaseTable<Resource>(
    "resources",
    "sort_order",
    (r) => ({ id: r.id, name: r.name, description: r.description, url: r.url, type: r.type }),
    RESOURCES
  );
}

export function useServices() {
  return useSupabaseTable<Service>(
    "services",
    "sort_order",
    (r) => ({ id: r.id, name: r.name, description: r.description, price: r.price, features: r.features ?? [] }),
    SERVICES
  );
}

export interface PortfolioProject {
  id: string;
  name: string;
  description: string;
  tech: string[];
  githubUrl?: string;
  liveUrl?: string;
  year: string;
  monogram?: string;
  featured: boolean;
}

const FALLBACK_PROJECTS: PortfolioProject[] = [
  {
    id: "fitzone",
    name: "FitZone",
    description:
      "A modern, responsive fitness website showcasing gym services, workout programs, and trainer profiles. Features smooth animations, intuitive navigation, and a clean design that converts visitors into members. Built to demonstrate responsive design and modern UX principles.",
    tech: ["HTML5", "CSS3", "JavaScript", "Responsive Design"],
    githubUrl: "https://github.com/abhyanshu2/My-portfolio/tree/main",
    year: "2024",
    monogram: "FZ",
    featured: true,
  },
  {
    id: "sticky-notes",
    name: "Sticky Notes",
    description:
      "Fully functional note-taking app with Local Storage persistence. Create, edit, and delete notes with a clean, minimal interface. Demonstrates DOM manipulation and JavaScript fundamentals.",
    tech: ["HTML", "CSS", "JavaScript"],
    githubUrl: "https://github.com/abhyanshu2/My-portfolio/tree/main",
    year: "2024",
    featured: false,
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description:
      "Modern personal portfolio built with React & Tailwind CSS. Showcases projects, skills, and contact info with responsive, interactive UI and smooth animations.",
    tech: ["React", "Tailwind CSS"],
    githubUrl: "https://github.com/abhyanshu2/My-portfolio/tree/main",
    year: "2024",
    featured: false,
  },
  {
    id: "wallpaper",
    name: "Wallpaper",
    description:
      "Pinterest-style wallpaper gallery with responsive grid layout, category browsing, and lazy loading. Built with modern CSS Grid and JavaScript for visual discovery.",
    tech: ["React", "CSS Grid"],
    githubUrl: "https://github.com/abhyanshu2/My-portfolio/tree/main",
    year: "2024",
    featured: false,
  },
];

export function useProjects() {
  return useSupabaseTable<PortfolioProject>(
    "portfolio_projects",
    "sort_order",
    (r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      tech: r.tech ?? [],
      githubUrl: r.github_url || undefined,
      liveUrl: r.live_url || undefined,
      year: r.year,
      monogram: r.monogram || undefined,
      featured: !!r.featured,
    }),
    FALLBACK_PROJECTS
  );
}