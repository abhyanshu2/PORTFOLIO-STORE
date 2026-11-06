import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import DriftWall from "@/components/portfolio/DriftWall";
import { supabase } from "@/lib/supabase";
import { uploadMediaFile } from "@/lib/upload-media";
import {
  DEFAULT_DRIFT_SETTINGS,
  driftWallProps,
  mapSettings,
  rowToItem,
  type DriftImageRow,
  type DriftSettings,
} from "@/lib/drift-wall";

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Shrinks big photos before upload so the homepage stays fast. */
async function shrinkImage(file: File, maxSide = 1400): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml")
    return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 600_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.86),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Same crop rules the homepage wall uses. */
function cropStyle(r: Pick<DriftImageRow, "fit" | "focus_x" | "focus_y" | "zoom">): CSSProperties {
  const zoom = Math.max(1, Number(r.zoom) || 1);
  return {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: r.fit === "contain" ? "contain" : "cover",
    objectPosition: `${r.focus_x}% ${r.focus_y}%`,
    transformOrigin: `${r.focus_x}% ${r.focus_y}%`,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
    userSelect: "none",
  };
}

type NumKey = {
  [K in keyof DriftSettings]: DriftSettings[K] extends number ? K : never;
}[keyof DriftSettings];

type Control =
  | { kind: "color"; key: "overlay_color"; label: string }
  | { kind: "range"; key: NumKey; label: string; min: number; max: number; step: number; unit?: string }
  | { kind: "select"; key: "direction"; label: string; options: { value: string; label: string }[] }
  | { kind: "toggle"; key: "pause_on_hover" | "grayscale"; label: string };

// Same controls and order as the "Customize" panel
const CONTROLS: Control[] = [
  { kind: "color", key: "overlay_color", label: "Overlay" },
  { kind: "range", key: "overlay_opacity", label: "Overlay Opacity", min: 0, max: 1, step: 0.05 },
  { kind: "range", key: "columns", label: "Columns", min: 2, max: 8, step: 1 },
  { kind: "range", key: "tile_width", label: "Tile Width", min: 100, max: 400, step: 5, unit: "px" },
  { kind: "range", key: "tile_height", label: "Tile Height", min: 60, max: 300, step: 2, unit: "px" },
  { kind: "range", key: "gap", label: "Gap", min: 0, max: 60, step: 1, unit: "px" },
  { kind: "range", key: "radius", label: "Radius", min: 0, max: 60, step: 1, unit: "px" },
  {
    kind: "select",
    key: "direction",
    label: "Direction",
    options: [
      { value: "up", label: "Up" },
      { value: "down", label: "Down" },
    ],
  },
  { kind: "range", key: "speed", label: "Speed", min: 0, max: 120, step: 1 },
  { kind: "range", key: "variance", label: "Variance", min: 0, max: 1, step: 0.05 },
  { kind: "range", key: "tilt", label: "Tilt", min: -60, max: 60, step: 1, unit: "°" },
  { kind: "range", key: "turn", label: "Turn", min: -60, max: 60, step: 1, unit: "°" },
  { kind: "range", key: "roll", label: "Roll", min: -45, max: 45, step: 1, unit: "°" },
  { kind: "range", key: "perspective", label: "Perspective", min: 300, max: 3000, step: 50, unit: "px" },
  { kind: "range", key: "depth", label: "Depth", min: 0, max: 400, step: 5, unit: "px" },
  { kind: "range", key: "parallax", label: "Parallax", min: 0, max: 2, step: 0.05 },
  { kind: "range", key: "lift", label: "Lift", min: 0, max: 200, step: 2, unit: "px" },
  { kind: "range", key: "fade", label: "Fade", min: 0, max: 1, step: 0.05 },
  { kind: "range", key: "dim", label: "Dim", min: 0, max: 1, step: 0.05 },
  { kind: "toggle", key: "pause_on_hover", label: "Pause on Hover" },
  { kind: "toggle", key: "grayscale", label: "Grayscale" },
];

const fmt = (v: number) => String(Number(v.toFixed(2)));

function labelOf(key: keyof DriftSettings): string {
  if (key === "enabled") return "Show the wall";
  return CONTROLS.find((c) => c.key === key)?.label ?? String(key);
}

// How a value is shown to the person, for example "40°", "Down", "On", "Auto"
function valueText(key: keyof DriftSettings, v: unknown): string {
  const c = CONTROLS.find((x) => x.key === key);
  if (key === "enabled" || typeof v === "boolean") return v ? "On" : "Off";
  if (c?.kind === "select") return c.options.find((o) => o.value === v)?.label ?? String(v);
  if (key === "overlay_color") return String(v) || "Auto";
  if (typeof v === "number") return fmt(v) + (c?.kind === "range" ? (c.unit ?? "") : "");
  return String(v);
}

const card: CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--surface)",
  borderRadius: 16,
  padding: 22,
  marginBottom: 20,
};
const smallLabel: CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13.5,
  fontWeight: 600,
  letterSpacing: 0,
  color: "var(--muted)",
};

export function DriftPanel() {
  const [rows, setRows] = useState<DriftImageRow[]>([]);
  const [settings, setSettings] = useState<DriftSettings>(DEFAULT_DRIFT_SETTINGS);
  const [, setSettingsDirty] = useState(false);
  // what is saved right now (what visitors see), so we can show what you changed
  const [saved, setSaved] = useState<DriftSettings>(DEFAULT_DRIFT_SETTINGS);
  const [lastChange, setLastChange] = useState<{ label: string; from: string; to: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"upload" | "settings" | "order" | null>(null);
  const [uploadInfo, setUploadInfo] = useState("");
  const [draft, setDraft] = useState<DriftImageRow | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const replaceRef = useRef<HTMLInputElement | null>(null);
  const cropRef = useRef<HTMLDivElement | null>(null);

  function explain(message: string) {
    if (/drift_(images|settings)|schema cache|does not exist/i.test(message)) {
      return "The Hero Wall tables are missing. Open Supabase → SQL Editor and run the file supabase/drift-wall.sql once, then refresh this page.";
    }
    return message;
  }

  async function load() {
    setLoading(true);
    const [imgs, sets] = await Promise.all([
      supabase.from("drift_images").select("*").order("sort_order", { ascending: true }),
      supabase.from("drift_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (imgs.error) setError(explain(imgs.error.message));
    else setError(null);
    setRows((imgs.data as DriftImageRow[]) || []);
    if (!sets.error) {
      const m = mapSettings(sets.data);
      setSettings(m);
      setSaved(m);
      setLastChange(null);
      setSettingsDirty(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const previewItems = useMemo(() => rows.map(rowToItem), [rows]);

  // ---------- adding photos ----------
  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy("upload");
    setError(null);
    let order = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const list = Array.from(files);
    try {
      for (let i = 0; i < list.length; i += 1) {
        setUploadInfo(`Uploading ${i + 1} of ${list.length}…`);
        const small = await shrinkImage(list[i]);
        const url = await uploadMediaFile(small);
        order += 10;
        const { error: err } = await supabase.from("drift_images").insert({
          image_url: url,
          title: list[i].name.replace(/\.\w+$/, ""),
          sort_order: order,
        });
        if (err) throw err;
      }
      setNotice(`${list.length} photo${list.length > 1 ? "s" : ""} added`);
    } catch (e) {
      setError(explain(e instanceof Error ? e.message : "Upload failed"));
    } finally {
      setUploadInfo("");
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    }
  }

  // ---------- ordering ----------
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    setBusy("order");
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const updates = next
      .map((r, i) => ({
        id: r.id,
        sort_order: (i + 1) * 10,
        changed: r.sort_order !== (i + 1) * 10,
      }))
      .filter((u) => u.changed);
    setRows(next.map((r, i) => ({ ...r, sort_order: (i + 1) * 10 })));
    const results = await Promise.all(
      updates.map((u) =>
        supabase.from("drift_images").update({ sort_order: u.sort_order }).eq("id", u.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) setError(explain(failed.error.message));
    setBusy(null);
  }

  async function removeRow(row: DriftImageRow) {
    if (!window.confirm("Remove this photo from the wall?")) return;
    const { error: err } = await supabase.from("drift_images").delete().eq("id", row.id);
    if (err) setError(explain(err.message));
    else setNotice("Photo removed");
    load();
  }

  // ---------- edit one photo ----------
  function patch(p: Partial<DriftImageRow>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function pickFocus(e: PointerEvent<HTMLDivElement>) {
    const box = cropRef.current?.getBoundingClientRect();
    if (!box) return;
    patch({
      focus_x: Math.round(clamp(((e.clientX - box.left) / box.width) * 100, 0, 100)),
      focus_y: Math.round(clamp(((e.clientY - box.top) / box.height) * 100, 0, 100)),
    });
  }

  async function replaceImage(files: FileList | null) {
    if (!files || files.length === 0) return;
    setReplacing(true);
    try {
      const url = await uploadMediaFile(await shrinkImage(files[0]));
      patch({ image_url: url });
    } catch (e) {
      setError(explain(e instanceof Error ? e.message : "Upload failed"));
    } finally {
      setReplacing(false);
      if (replaceRef.current) replaceRef.current.value = "";
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSavingDraft(true);
    const { error: err } = await supabase
      .from("drift_images")
      .update({
        image_url: draft.image_url,
        title: draft.title || null,
        link_url: draft.link_url || null,
        col_index: draft.col_index,
        height_scale: draft.height_scale,
        width_scale: draft.width_scale,
        fit: draft.fit,
        focus_x: draft.focus_x,
        focus_y: draft.focus_y,
        zoom: draft.zoom,
      })
      .eq("id", draft.id);
    setSavingDraft(false);
    if (err) {
      setError(explain(err.message));
      return;
    }
    setDraft(null);
    setNotice("Photo saved");
    load();
  }

  // ---------- wall settings ----------
  function setSetting<K extends keyof DriftSettings>(key: K, value: DriftSettings[K]) {
    setLastChange({
      label: labelOf(key),
      from: valueText(key, saved[key]),
      to: valueText(key, value),
    });
    setSettings((s) => ({ ...s, [key]: value }));
    setSettingsDirty(true);
  }

  async function saveSettings() {
    setBusy("settings");
    const { error: err } = await supabase.from("drift_settings").upsert({ id: 1, ...settings });
    setBusy(null);
    if (err) setError(explain(err.message));
    else {
      setSettingsDirty(false);
      setSaved(settings);
      setLastChange(null);
      setNotice("Wall settings saved");
    }
  }

  const changeList = [
    { key: "enabled" as keyof DriftSettings, label: "Show the wall" },
    ...CONTROLS.map((c) => ({ key: c.key as keyof DriftSettings, label: c.label })),
  ].filter((x) => settings[x.key] !== saved[x.key]);
  const changedKeys = new Set<string>(changeList.map((x) => x.key));

  function renderControl(c: Control) {
    const tileClass = (extra: string) =>
      `dw-tile ${extra}${changedKeys.has(c.key) ? " changed" : ""}`.replace("  ", " ");
    if (c.kind === "range") {
      const v = Number(settings[c.key]);
      const pct = clamp(((v - c.min) / (c.max - c.min)) * 100, 0, 100);
      return (
        <label key={c.key} className={tileClass("dw-range")}>
          <span className="dw-fill" style={{ width: `${pct}%` }} />
          <span className="dw-name">{c.label}</span>
          <span className="dw-val">
            {fmt(v)}
            {c.unit ?? ""}
          </span>
          <input
            type="range"
            aria-label={c.label}
            min={c.min}
            max={c.max}
            step={c.step}
            value={v}
            onChange={(e) => setSetting(c.key, Number(e.target.value) as never)}
          />
        </label>
      );
    }
    if (c.kind === "toggle") {
      return (
        <label key={c.key} className={tileClass("dw-click")}>
          <span className="dw-name">{c.label}</span>
          <span className="dw-switch">
            <input
              type="checkbox"
              role="switch"
              checked={settings[c.key]}
              onChange={(e) => setSetting(c.key, e.target.checked)}
            />
            <i />
          </span>
        </label>
      );
    }
    if (c.kind === "select") {
      return (
        <label key={c.key} className={tileClass("dw-click")}>
          <span className="dw-name">{c.label}</span>
          <select
            className="dw-select"
            value={settings[c.key]}
            onChange={(e) => setSetting(c.key, e.target.value as DriftSettings["direction"])}
          >
            {c.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    }
    const hex = /^#[0-9a-f]{6}$/i.test(settings.overlay_color) ? settings.overlay_color : "#060010";
    return (
      <div key={c.key} className={tileClass("")}>
        <span className="dw-name">{c.label}</span>
        <span className="dw-color">
          <input
            type="color"
            aria-label="Pick overlay colour"
            value={hex}
            onChange={(e) => setSetting("overlay_color", e.target.value)}
          />
          <input
            type="text"
            aria-label="Overlay colour"
            placeholder="Auto"
            maxLength={32}
            spellCheck={false}
            value={settings.overlay_color}
            onChange={(e) => setSetting("overlay_color", e.target.value)}
          />
        </span>
      </div>
    );
  }

  // size of the crop box in the edit window, same shape as a real tile
  const cropBox = useMemo(() => {
    if (!draft) return { w: 300, h: 200 };
    const ratio =
      (settings.tile_width * draft.width_scale) / (settings.tile_height * draft.height_scale);
    const w = Math.min(340, 360 * ratio);
    return { w, h: w / ratio };
  }, [draft, settings.tile_width, settings.tile_height]);

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">
            Hero Wall
            <span className="admin-section-count">{rows.length} photos</span>
          </h2>
          <p className="admin-section-desc">
            The photo wall behind your name on the homepage. Add photos, change their order and
            choose how each one is cropped.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {uploadInfo && <span style={smallLabel}>{uploadInfo}</span>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            className="admin-btn-primary"
            disabled={busy === "upload"}
            onClick={() => fileRef.current?.click()}
          >
            {busy === "upload" ? "Uploading…" : "+ Add photos"}
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {notice && (
        <div style={{ ...smallLabel, color: "var(--accent2)", marginBottom: 14 }}>{notice}</div>
      )}

      <div className="dw-studio">
        {/* left: live preview + what you changed. It stays on screen while you scroll the settings. */}
        <div className="dw-preview-col">
          <div className="dw-preview-title">
            <span>Live preview</span>
            <span className="dw-preview-sub">Updates as you move a slider</span>
          </div>
          <div className="dw-preview-box">
            {!loading && <DriftWall items={previewItems} {...driftWallProps(settings)} maskMode="open-top" />}
            {!loading && rows.length === 0 && (
              <div className="admin-empty dw-preview-empty">
                No photos yet. The homepage shows sample photos until you add your own.
              </div>
            )}
            {lastChange && (
              <div className="dw-badge" aria-live="polite">
                <b>{lastChange.label}</b>
                <span>{lastChange.from}</span>
                <i>→</i>
                <strong>{lastChange.to}</strong>
              </div>
            )}
          </div>

          <div className="dw-changes">
            {changeList.length === 0 ? (
              <span className="admin-dim">No changes. This is what visitors see now.</span>
            ) : (
              <>
                <div className="dw-changes-title">
                  {changeList.length} unsaved change{changeList.length > 1 ? "s" : ""}
                </div>
                <div className="dw-chips">
                  {changeList.map((x) => (
                    <span key={x.key} className="dw-chip">
                      <b>{x.label}</b>
                      {valueText(x.key, saved[x.key])}
                      <i>→</i>
                      <strong>{valueText(x.key, settings[x.key])}</strong>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="dw-actions">
            <button
              className="admin-btn-primary"
              disabled={busy === "settings"}
              onClick={saveSettings}
            >
              {busy === "settings" ? "Saving…" : "Save settings"}
            </button>
            <button
              className="admin-btn-ghost"
              disabled={changeList.length === 0}
              onClick={() => {
                setSettings(saved);
                setSettingsDirty(false);
                setLastChange(null);
              }}
            >
              Undo changes
            </button>
            <button
              className="admin-btn-ghost"
              onClick={() => {
                setSettings(DEFAULT_DRIFT_SETTINGS);
                setSettingsDirty(true);
                setLastChange(null);
              }}
            >
              Reset to default
            </button>
          </div>
        </div>

        {/* right: all the settings */}
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div className="admin-card-title">Customize</div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSetting("enabled", e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
              Show the wall on the homepage
            </label>
          </div>
          <div className="dw-grid">{CONTROLS.map(renderControl)}</div>
          <div className="admin-hint" style={{ marginTop: 12 }}>
            Photos too dark? Raise Dim (higher is brighter) and lower Overlay Opacity (lower is
            brighter). Overlay is the tint colour: leave it empty for Auto, which follows your page
            background in dark and light theme. Settings marked with a dot are changed but not saved
            yet.
          </div>
        </div>
      </div>

      {/* photo list */}
      <div className="admin-card-title" style={{ marginBottom: 12 }}>
        Photos
      </div>
      {loading ? (
        <div className="admin-empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          Nothing here yet. Click “+ Add photos” and pick one or many images.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {rows.map((row, i) => (
            <div key={row.id} className="admin-card" style={{ margin: 0, padding: 12 }}>
              <div
                style={{
                  height: 120,
                  overflow: "hidden",
                  borderRadius: 10,
                  background: "#0b0b12",
                  position: "relative",
                  marginBottom: 10,
                }}
              >
                <img
                  src={row.image_url}
                  alt={row.title ?? ""}
                  style={cropStyle(row)}
                  draggable={false}
                />
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,.65)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  #{i + 1}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--heading)",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.title || "Untitled"}
              </div>
              <div style={{ ...smallLabel, margin: "4px 0 10px" }}>
                Col {row.col_index ?? "auto"} · H {Number(row.height_scale).toFixed(2)}× · W{" "}
                {Math.round(Number(row.width_scale) * 100)}%
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="admin-btn-small" onClick={() => setDraft({ ...row })}>
                  Edit
                </button>
                <button
                  className="admin-btn-small"
                  disabled={i === 0 || busy === "order"}
                  onClick={() => move(i, -1)}
                  title="Move earlier"
                >
                  ↑
                </button>
                <button
                  className="admin-btn-small"
                  disabled={i === rows.length - 1 || busy === "order"}
                  onClick={() => move(i, 1)}
                  title="Move later"
                >
                  ↓
                </button>
                <button className="admin-btn-small danger" onClick={() => removeRow(row)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* edit window */}
      {draft && (
        <div className="admin-overlay" onClick={() => !savingDraft && setDraft(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 820 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-title">Edit photo</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 28,
              }}
            >
              {/* crop area */}
              <div>
                <div style={{ ...smallLabel, marginBottom: 8 }}>
                  Crop: drag or click to choose the visible part
                </div>
                <div
                  ref={cropRef}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    pickFocus(e);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons) pickFocus(e);
                  }}
                  style={{
                    position: "relative",
                    width: cropBox.w,
                    height: cropBox.h,
                    maxWidth: "100%",
                    overflow: "hidden",
                    borderRadius: Math.min(settings.radius, 24),
                    background: "#0b0b12",
                    border: "1px solid var(--border-strong)",
                    cursor: "crosshair",
                    touchAction: "none",
                  }}
                >
                  <img src={draft.image_url} alt="" style={cropStyle(draft)} draggable={false} />
                  <span
                    style={{
                      position: "absolute",
                      left: `${draft.focus_x}%`,
                      top: `${draft.focus_y}%`,
                      width: 14,
                      height: 14,
                      marginLeft: -7,
                      marginTop: -7,
                      borderRadius: "50%",
                      border: "2px solid #fff",
                      boxShadow: "0 0 0 1px rgba(0,0,0,.5)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <input
                    ref={replaceRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => replaceImage(e.target.files)}
                  />
                  <button
                    className="admin-btn-small"
                    disabled={replacing}
                    onClick={() => replaceRef.current?.click()}
                  >
                    {replacing ? "Uploading…" : "Replace photo"}
                  </button>
                  <button
                    className="admin-btn-small"
                    onClick={() =>
                      patch({
                        fit: "cover",
                        focus_x: 50,
                        focus_y: 50,
                        zoom: 1,
                        height_scale: 1,
                        width_scale: 1,
                      })
                    }
                  >
                    Reset crop & size
                  </button>
                </div>
              </div>

              {/* controls */}
              <div>
                <div className="admin-field">
                  <label className="admin-label">Title</label>
                  <input
                    className="admin-input"
                    value={draft.title ?? ""}
                    onChange={(e) => patch({ title: e.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label className="admin-label">Link (optional, opens when clicked)</label>
                  <input
                    className="admin-input"
                    placeholder="https://"
                    value={draft.link_url ?? ""}
                    onChange={(e) => patch({ link_url: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="admin-field">
                    <label className="admin-label">Column</label>
                    <select
                      className="admin-select"
                      value={draft.col_index ?? ""}
                      onChange={(e) =>
                        patch({ col_index: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    >
                      <option value="">Auto</option>
                      {Array.from({ length: settings.columns }, (_, i) => (
                        <option key={i} value={i + 1}>
                          Column {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Fit</label>
                    <select
                      className="admin-select"
                      value={draft.fit}
                      onChange={(e) => patch({ fit: e.target.value as "cover" | "contain" })}
                    >
                      <option value="cover">Fill & crop</option>
                      <option value="contain">Show whole photo</option>
                    </select>
                  </div>
                </div>

                {[
                  {
                    key: "height_scale",
                    label: "Height",
                    min: 0.5,
                    max: 2.5,
                    step: 0.05,
                    show: (v: number) => `${v.toFixed(2)}×`,
                  },
                  {
                    key: "width_scale",
                    label: "Width",
                    min: 0.5,
                    max: 1,
                    step: 0.05,
                    show: (v: number) => `${Math.round(v * 100)}%`,
                  },
                  {
                    key: "zoom",
                    label: "Zoom",
                    min: 1,
                    max: 3,
                    step: 0.05,
                    show: (v: number) => `${v.toFixed(2)}×`,
                  },
                ].map((f) => {
                  const value = Number(draft[f.key as "height_scale" | "width_scale" | "zoom"]);
                  return (
                    <div className="admin-field" key={f.key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          ...smallLabel,
                          marginBottom: 6,
                        }}
                      >
                        <span>{f.label}</span>
                        <span style={{ color: "var(--accent2)" }}>{f.show(value)}</span>
                      </div>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={value}
                        onChange={(e) =>
                          patch({ [f.key]: Number(e.target.value) } as Partial<DriftImageRow>)
                        }
                        style={{ width: "100%", accentColor: "var(--accent)" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                className="admin-btn-ghost"
                disabled={savingDraft}
                onClick={() => setDraft(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn-primary"
                disabled={savingDraft || replacing}
                onClick={saveDraft}
              >
                {savingDraft ? "Saving…" : "Save photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}