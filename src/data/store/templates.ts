import type { CategorySlug } from "./categories";
import scrapCollage from "@/assets/templates/scrapbook-collage.jpg.asset.json";
import scrapBook from "@/assets/templates/scrapbook-book.jpg.asset.json";
import scrapMobile from "@/assets/templates/scrapbook-mobile.jpg.asset.json";

export type Badge = "premium" | "new" | "trending" | "bestseller";

export type Template = {
  id: string;
  name: string;
  monogram: string; // 2-letter shown on gradient cover
  category: Exclude<CategorySlug, "all">;
  description: string;
  features: string[];
  price: number;
  badge?: Badge;
  screenshots: string[]; // labels for monogram thumbnails
  images?: string[]; // real screenshot URLs (overrides monogram gallery)
  cover?: string; // real cover image for the card
  videoUrl?: string; // demo video, shown as a tab in the preview gallery
  demoUrl?: string; // live demo route
};

export const TEMPLATES: Template[] = [
  // ---------- BIRTHDAY (5) ----------
  {
    id: "birthday-scrapbook",
    name: "Birthday Scrapbook — Photo Collage",
    monogram: "BS",
    category: "birthday",
    description:
      "Editable birthday scrapbook with a pinned photo collage page and a real flip-through book — upload your own photos and rewrite every caption.",
    features: [
      "Upload your own photos",
      "Every caption editable",
      "2 pages: collage + flip book",
      "Drag, zoom & pin photos",
      "Saves in the browser",
      "Mobile + desktop ready",
    ],
    price: 199,
    badge: "trending",
    screenshots: ["01", "02", "03"],
    images: [scrapCollage.url, scrapBook.url, scrapMobile.url],
    cover: scrapCollage.url,
    demoUrl: "/templates/birthday-scrapbook",
  },
  {
    id: "birthday-balloon-pop",
    name: "Balloon Pop",
    monogram: "BP",
    category: "birthday",
    description: "Playful balloon-popping birthday surprise page with tap-to-reveal message.",
    features: ["Tap interaction", "Custom message", "Confetti burst", "Shareable link"],
    price: 149,
    badge: "new",
    screenshots: ["01", "02"],
  },
  {
    id: "birthday-cake-countdown",
    name: "Cake Countdown",
    monogram: "CC",
    category: "birthday",
    description: "Countdown-to-birthday page with animated cake reveal and candle-blow effect.",
    features: ["Live countdown", "Candle animation", "Photo slot", "Mobile-first"],
    price: 179,
    screenshots: ["01", "02", "03"],
  },
  // ---------- PROPOSAL (3) ----------
  {
    id: "proposal-forever",
    name: "Forever & Always",
    monogram: "PF",
    category: "proposal",
    description: "Yes/No animated proposal page with playful button that keeps escaping.",
    features: ["Playful button", "Confetti burst", "Photo backdrop", "Response capture"],
    price: 249,
    badge: "trending",
    screenshots: ["01", "02", "03"],
  },
  {
    id: "proposal-ring-box",
    name: "The Ring Box",
    monogram: "RB",
    category: "proposal",
    description: "Elegant animated ring-box opening reveal leading into a heartfelt proposal message.",
    features: ["Box-open animation", "Custom message", "Music slot", "Mobile-first"],
    price: 299,
    badge: "premium",
    screenshots: ["01", "02", "03"],
  },
  {
    id: "proposal-starry-night",
    name: "Starry Night Ask",
    monogram: "SN",
    category: "proposal",
    description: "Dreamy starfield proposal page with twinkling animation and love note reveal.",
    features: ["Starfield animation", "Love note reveal", "Photo backdrop", "Share link"],
    price: 219,
    badge: "new",
    screenshots: ["01", "02"],
  },
  // ---------- WEDDING (3) ----------
  {
    id: "wedding-noir",
    name: "Noir Vows",
    monogram: "WN",
    category: "wedding",
    description: "Editorial wedding invite with monogram crest, RSVP flow, and gallery.",
    features: ["RSVP form", "Photo gallery", "Countdown timer", "Multi-page"],
    price: 499,
    badge: "premium",
    screenshots: ["01", "02", "03", "04"],
  },
  {
    id: "wedding-royal-gold",
    name: "Royal Gold",
    monogram: "RG",
    category: "wedding",
    description: "Traditional gold-foil wedding invitation with family details and event schedule.",
    features: ["Event schedule", "Family details", "Gold accents", "RSVP embedded"],
    price: 449,
    badge: "trending",
    screenshots: ["01", "02", "03"],
  },
  {
    id: "wedding-garden-blush",
    name: "Garden Blush",
    monogram: "GB",
    category: "wedding",
    description: "Soft floral wedding invite with pastel palette and venue map integration.",
    features: ["Floral theme", "Venue map", "RSVP form", "Countdown timer"],
    price: 399,
    badge: "new",
    screenshots: ["01", "02"],
  },
  // ---------- SORRY (3) ----------
  {
    id: "sorry-paper-heart",
    name: "Paper Heart",
    monogram: "PH",
    category: "sorry",
    description: "Gentle animated sorry page with a torn-paper-heart-mending effect and heartfelt note.",
    features: ["Mending animation", "Custom message", "Music slot", "Mobile-first"],
    price: 149,
    badge: "trending",
    screenshots: ["01", "02"],
  },
  {
    id: "sorry-falling-petals",
    name: "Falling Petals",
    monogram: "FP",
    category: "sorry",
    description: "Soft falling-petals background with a scrollable apology letter.",
    features: ["Petal animation", "Scroll reveal", "Custom photo", "Share link"],
    price: 129,
    badge: "new",
    screenshots: ["01", "02"],
  },
  {
    id: "sorry-letter-unfold",
    name: "Letter Unfold",
    monogram: "LU",
    category: "sorry",
    description: "Handwritten-style unfolding letter animation to say sorry sincerely.",
    features: ["Unfold animation", "Handwritten font", "Audio player", "Mobile-first"],
    price: 149,
    screenshots: ["01", "02", "03"],
  },
];