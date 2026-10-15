import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface ExperienceItem {
  id: string;
  role: string;
  place: string;
  dates: string;
  current: boolean;
  points: string[];
  tags: string[];
}

// Shown until the database answers, and whenever the database can't be reached
export const FALLBACK_EXPERIENCE: ExperienceItem[] = [
  {
    id: "vybe",
    role: "Founder",
    place: "VYBE · Social media platform",
    dates: "2025 – Present",
    current: true,
    points: [
      "Created VYBE, my own social media platform built to bring a community together.",
      "Leading the idea, design and development of the product.",
    ],
    tags: ["Next.js", "Express.js", "MongoDB"],
  },
  {
    id: "sysnet-fullstack",
    role: "Full Stack Developer Intern",
    place: "Sysnet Global Technologies (P) Ltd",
    dates: "Jun 2026 – Present",
    current: true,
    points: [
      "Working on real-world full stack web development projects.",
      "Learning hands-on industry practices while building with React and Node.js.",
    ],
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
  },
  {
    id: "sysnet-support",
    role: "Intern, Support Operations",
    place: "Sysnet Global Technologies (P) Ltd",
    dates: "Feb 2026 – May 2026",
    current: false,
    points: [
      "Worked in Support Operations related to System Software.",
      "Gained hands-on exposure to HTML, React and Java.",
      "Completed the 3-month internship and received an Internship Certificate.",
    ],
    tags: ["HTML", "React", "Java"],
  },
];

function mapRow(r: any): ExperienceItem {
  return {
    id: String(r.id),
    role: r.role ?? "",
    place: r.place ?? "",
    dates: r.dates ?? "",
    current: r.status === "current",
    points: Array.isArray(r.points) ? r.points : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
  };
}

/** Loads the Experience entries that are managed in Admin → Experience. */
export function useExperience() {
  const [state, setState] = useState<{ items: ExperienceItem[]; loaded: boolean }>({
    items: FALLBACK_EXPERIENCE,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("experience")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        // table missing / no connection → keep the built-in entries
        if (error || !data) setState({ items: FALLBACK_EXPERIENCE, loaded: true });
        else setState({ items: data.map(mapRow), loaded: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
