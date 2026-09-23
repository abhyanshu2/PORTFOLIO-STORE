export const CATEGORIES = [
  { slug: "all", name: "All" },
  { slug: "birthday", name: "Birthday" },
  { slug: "proposal", name: "Proposal" },
  { slug: "wedding", name: "Wedding" },
  { slug: "sorry", name: "Sorry" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
