import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { DriftWallItem } from "@/components/portfolio/DriftWall";

export interface DriftSettings {
  enabled: boolean;
  columns: number;
  tile_width: number;
  tile_height: number;
  gap: number;
  radius: number;
  speed: number;
  tilt: number;
  turn: number;
  dim: number;
}

export interface DriftImageRow {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  col_index: number | null;
  sort_order: number;
  height_scale: number;
  width_scale: number;
  fit: "cover" | "contain";
  focus_x: number;
  focus_y: number;
  zoom: number;
}

export const DEFAULT_DRIFT_SETTINGS: DriftSettings = {
  enabled: true,
  columns: 5,
  tile_width: 200,
  tile_height: 132,
  gap: 18,
  radius: 14,
  speed: 20,
  tilt: 16,
  turn: -14,
  dim: 0.55,
};

// Shown until real photos are added from the admin panel
const SAMPLE_IDS = [
  1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110, 133, 164,
];
export const SAMPLE_DRIFT_ITEMS: DriftWallItem[] = SAMPLE_IDS.map((id, i) => ({
  image: `https://picsum.photos/id/${id}/600/400`,
  title: `Photo ${i + 1}`,
}));

export function rowToItem(r: DriftImageRow): DriftWallItem {
  return {
    image: r.image_url,
    title: r.title || undefined,
    href: r.link_url || undefined,
    column: r.col_index === null || r.col_index === undefined ? null : Number(r.col_index) - 1,
    heightScale: Number(r.height_scale ?? 1),
    widthScale: Number(r.width_scale ?? 1),
    fit: r.fit === "contain" ? "contain" : "cover",
    focusX: Number(r.focus_x ?? 50),
    focusY: Number(r.focus_y ?? 50),
    zoom: Number(r.zoom ?? 1),
  };
}

export function mapSettings(r: any): DriftSettings {
  const d = DEFAULT_DRIFT_SETTINGS;
  if (!r) return d;
  const num = (v: any, fallback: number) =>
    v === null || v === undefined || Number.isNaN(Number(v)) ? fallback : Number(v);
  return {
    enabled: r.enabled ?? d.enabled,
    columns: num(r.columns, d.columns),
    tile_width: num(r.tile_width, d.tile_width),
    tile_height: num(r.tile_height, d.tile_height),
    gap: num(r.gap, d.gap),
    radius: num(r.radius, d.radius),
    speed: num(r.speed, d.speed),
    tilt: num(r.tilt, d.tilt),
    turn: num(r.turn, d.turn),
    dim: num(r.dim, d.dim),
  };
}

/**
 * Loads the hero wall photos + settings from Supabase.
 * If anything fails (or no photo has been added yet) the sample photos and
 * default settings are used, so the homepage never breaks.
 * `ready` becomes true once loading finished, so the wall appears only once
 * with the right photos (no flash of sample photos first).
 */
export function useDriftWall() {
  const [state, setState] = useState<{
    ready: boolean;
    items: DriftWallItem[];
    settings: DriftSettings;
  }>({
    ready: false,
    items: SAMPLE_DRIFT_ITEMS,
    settings: DEFAULT_DRIFT_SETTINGS,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("drift_images").select("*").order("sort_order", { ascending: true }),
      supabase.from("drift_settings").select("*").eq("id", 1).maybeSingle(),
    ])
      .then(([imgs, sets]) => {
        if (cancelled) return;
        const rows = !imgs.error && imgs.data ? (imgs.data as DriftImageRow[]) : [];
        setState({
          ready: true,
          items: rows.length > 0 ? rows.map(rowToItem) : SAMPLE_DRIFT_ITEMS,
          settings: !sets.error ? mapSettings(sets.data) : DEFAULT_DRIFT_SETTINGS,
        });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, ready: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
