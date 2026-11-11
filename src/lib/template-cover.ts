import type { Template } from "@/data/store/templates";

const COLORS: Record<string, string> = {
  birthday: "#f0a830",
  proposal: "#e5606f",
  wedding: "#d8b979",
  sorry: "#6f9bf2",
};

const cache = new Map<string, string>();

export function monogramCover(t: Pick<Template, "id" | "category" | "monogram">): string {
  const hit = cache.get(t.id);
  if (hit) return hit;
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 640;
  const x = c.getContext("2d");
  if (!x) return "";
  const g = x.createLinearGradient(0, 0, 480, 640);
  g.addColorStop(0, COLORS[t.category] ?? "#d4870a");
  g.addColorStop(1, "#140f08");
  x.fillStyle = g;
  x.fillRect(0, 0, 480, 640);
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.textAlign = "center";
  x.font = "italic 600 200px Georgia, serif";
  x.fillText(t.monogram, 240, 350);
  x.textAlign = "left";
  x.font = "16px monospace";
  x.fillStyle = "rgba(255,255,255,0.75)";
  x.fillText(t.category.toUpperCase(), 32, 52);
  const url = c.toDataURL("image/jpeg", 0.88);
  cache.set(t.id, url);
  return url;
}
