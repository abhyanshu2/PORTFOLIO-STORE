import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { DriftWallItem, DriftWallProps } from "@/components/portfolio/DriftWall";

export interface DriftSettings {
  enabled: boolean;
  /** CSS colour for the dim overlay on the photos. Empty = automatic (matches the page background). */
  overlay_color: string;
  /** Strength of the overlay tint, 0 to 1. Lower = brighter photos. */
  overlay_opacity: number;
  columns: number;
  tile_width: number;
  tile_height: number;
  gap: number;
  radius: number;
  direction: "up" | "down";
  speed: number;
  variance: number;
  tilt: number;
  turn: number;
  roll: number;
  perspective: number;
  depth: number;
  parallax: number;
  lift: number;
  fade: number;
  dim: number;
  pause_on_hover: boolean;
  grayscale: boolean;
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
  overlay_color: "",
  overlay_opacity: 0.15,
  columns: 5,
  tile_width: 200,
  tile_height: 132,
  gap: 18,
  radius: 14,
  direction: "up",
  speed: 42,
  variance: 0.45,
  tilt: 16,
  turn: -14,
  roll: 0,
  perspective: 1200,
  depth: 120,
  parallax: 0.6,
  lift: 64,
  fade: 0.6,
  dim: 0.85,
  pause_on_hover: false,
  grayscale: false,
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

type SettingsRow = Partial<Record<keyof DriftSettings, unknown>> | null | undefined;

export function mapSettings(r: SettingsRow): DriftSettings {
  const d = DEFAULT_DRIFT_SETTINGS;
  if (!r) return d;
  const num = (v: unknown, fallback: number) =>
    v === null || v === undefined || Number.isNaN(Number(v)) ? fallback : Number(v);
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  return {
    enabled: bool(r.enabled, d.enabled),
    overlay_color: typeof r.overlay_color === "string" ? r.overlay_color.trim() : d.overlay_color,
    overlay_opacity: num(r.overlay_opacity, d.overlay_opacity),
    columns: num(r.columns, d.columns),
    tile_width: num(r.tile_width, d.tile_width),
    tile_height: num(r.tile_height, d.tile_height),
    gap: num(r.gap, d.gap),
    radius: num(r.radius, d.radius),
    direction: r.direction === "down" ? "down" : "up",
    speed: num(r.speed, d.speed),
    variance: num(r.variance, d.variance),
    tilt: num(r.tilt, d.tilt),
    turn: num(r.turn, d.turn),
    roll: num(r.roll, d.roll),
    perspective: num(r.perspective, d.perspective),
    depth: num(r.depth, d.depth),
    parallax: num(r.parallax, d.parallax),
    lift: num(r.lift, d.lift),
    fade: num(r.fade, d.fade),
    dim: num(r.dim, d.dim),
    pause_on_hover: bool(r.pause_on_hover, d.pause_on_hover),
    grayscale: bool(r.grayscale, d.grayscale),
  };
}

/** Turns the saved settings into props for <DriftWall>. Used by the homepage and the admin preview. */
export function driftWallProps(s: DriftSettings): Partial<DriftWallProps> {
  return {
    columns: s.columns,
    tileWidth: s.tile_width,
    tileHeight: s.tile_height,
    gap: s.gap,
    radius: s.radius,
    direction: s.direction,
    speed: s.speed,
    variance: s.variance,
    tilt: s.tilt,
    turn: s.turn,
    roll: s.roll,
    perspective: s.perspective,
    depth: s.depth,
    parallax: s.parallax,
    lift: s.lift,
    fade: s.fade,
    dim: s.dim,
    pauseOnHover: s.pause_on_hover,
    grayscale: s.grayscale,
    // empty = automatic: follow the page background so it works in dark and light theme
    overlayColor: s.overlay_color || "var(--bg)",
    overlayOpacity: s.overlay_opacity,
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