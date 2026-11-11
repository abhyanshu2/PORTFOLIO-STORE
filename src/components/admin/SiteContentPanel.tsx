import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useTemplates } from "@/lib/use-store-data";
import { monogramCover } from "@/lib/template-cover";
import HoloCard from "@/components/store/HoloCard";
import FlexCarousel from "@/components/store/FlexCarousel";
import {
  DEFAULT_SITE_CONTENT,
  loadSiteContent,
  setSiteContentCache,
  type SiteContent,
} from "@/lib/site-content";

type Path = (string | number)[];
type Section = "intro" | "about" | "skills" | "more" | "contact" | "store";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "intro", label: "Intro (Hero)" },
  { key: "about", label: "About" },
  { key: "skills", label: "Skills" },
  { key: "more", label: "Projects & Education" },
  { key: "contact", label: "Contact" },
  { key: "store", label: "Store" },
];

const row: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" };
const box: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 12, background: "var(--bg)" };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--muted)", margin: "4px 0 0" };

function getAt(obj: unknown, path: Path): unknown {
  return path.reduce<unknown>((o, k) => (o as Record<string | number, unknown>)?.[k], obj);
}


const Ctx = createContext<{ draft: SiteContent; set: (p: Path, v: unknown) => void }>({
  draft: DEFAULT_SITE_CONTENT,
  set: () => {},
});
const useCtx = () => useContext(Ctx);

function Text({ label, path, help, multiline }: { label: string; path: Path; help?: string; multiline?: boolean }) {
  const { draft, set } = useCtx();
  const value = String(getAt(draft, path) ?? "");
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      {multiline ? (
        <textarea className="admin-textarea" rows={4} value={value} onChange={(e) => set(path, e.target.value)} />
      ) : (
        <input className="admin-input" value={value} onChange={(e) => set(path, e.target.value)} />
      )}
      {help && <p style={hint}>{help}</p>}
    </div>
  );
}

function ListField({
  label,
  list,
  onChange,
  sep,
  rows,
  help,
}: {
  label?: string;
  list: string[];
  onChange: (next: string[]) => void;
  sep: "\n" | ",";
  rows: number;
  help?: string;
}) {
  const parse = (t: string) => t.split(sep).map((x) => x.trim()).filter(Boolean);
  const [text, setText] = useState(list.join(sep === "," ? ", " : "\n"));
  useEffect(() => {
    if (JSON.stringify(parse(text)) !== JSON.stringify(list)) setText(list.join(sep === "," ? ", " : "\n"));
  }, [list]);
  return (
    <div className="admin-field" style={{ marginBottom: label ? undefined : 6 }}>
      {label && <label className="admin-label">{label}</label>}
      <textarea
        className="admin-textarea"
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parse(e.target.value));
        }}
      />
      {help && <p style={hint}>{help}</p>}
    </div>
  );
}

function Lines({ label, path, help, rows = 5 }: { label: string; path: Path; help?: string; rows?: number }) {
  const { draft, set } = useCtx();
  return (
    <ListField label={label} list={(getAt(draft, path) as string[]) ?? []} onChange={(n) => set(path, n)} sep={"\n"} rows={rows} help={help} />
  );
}

function Select({ label, path, options }: { label: string; path: Path; options: { value: string; label: string }[] }) {
  const { draft, set } = useCtx();
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      <select className="admin-select" value={String(getAt(draft, path) ?? "")} onChange={(e) => set(path, e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, path }: { label: string; path: Path }) {
  const { draft, set } = useCtx();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 0" }}>
      <input
        type="checkbox"
        checked={Boolean(getAt(draft, path))}
        onChange={(e) => set(path, e.target.checked)}
        style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
      />
      <span>{label}</span>
    </label>
  );
}

function ColorField({ label, path }: { label: string; path: Path }) {
  const { draft, set } = useCtx();
  const value = String(getAt(draft, path) ?? "");
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#e2e6ec"}
          onChange={(e) => set(path, e.target.value)}
          style={{ width: 48, height: 44, padding: 2, border: "1px solid var(--border-strong)", borderRadius: 10, background: "var(--bg)", cursor: "pointer" }}
        />
        <input className="admin-input" value={value} onChange={(e) => set(path, e.target.value)} />
      </div>
    </div>
  );
}

function Slider({
  label,
  path,
  min,
  max,
  step,
  unit = "",
}: {
  label: string;
  path: Path;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  const { draft, set } = useCtx();
  const value = Number(getAt(draft, path) ?? 0);
  return (
    <div className="admin-field">
      <label className="admin-label" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <b style={{ color: "var(--heading)" }}>
          {+value.toFixed(2)}
          {unit}
        </b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(path, Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--accent)" }}
      />
    </div>
  );
}

const CAROUSEL_PRESETS: Record<string, Record<string, number | string | boolean>> = {
  liquid: { lensWidth: 0.74, lensHeight: 1.18, tilt: 62, roundness: 1, bend: 0.34, reach: 0.38, curl: "twist", dispersion: 0.45, liquid: 0, followCursor: false },
  ribbon: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.34, reach: 0.34, curl: "twist", dispersion: 0.4, liquid: 0, followCursor: false },
  vortex: { lensWidth: 0.7, lensHeight: 0.95, tilt: 30, roundness: 1, bend: 0.46, reach: 0.3, curl: "twist", dispersion: 0.5, liquid: 0, followCursor: false },
  arch: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.3, reach: 0.36, curl: "rise", dispersion: 0.4, liquid: 0, followCursor: false },
};

function CarouselSettings() {
  const { draft, set } = useCtx();
  const { data: templates } = useTemplates();
  const c = draft.store.carousel;
  const items = templates.slice(0, 8).map((t) => ({
    src: t.cover || monogramCover(t),
    alt: t.name,
    title: t.name,
    subtitle: `₹${t.price}`,
  }));
  const opt = (list: string[]) => list.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
  const base = ["store", "carousel"];
  const p = (k: string): Path => [...base, k];
  return (
    <Group title="Templates carousel (All Templates section)">
      <p style={{ ...hint, marginBottom: 12 }}>
        The sliding bent-card carousel. Drag the preview below to test. Card height and Box height change the size.
      </p>
      <div style={{ height: 360, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 18, color: "var(--heading)" }}>
        {items.length > 0 && <FlexCarousel items={items} {...c} captureWheel={false} />}
      </div>
      <div style={row}>
        <div className="admin-field">
          <label className="admin-label">Preset</label>
          <select
            className="admin-select"
            value={c.preset}
            onChange={(e) => {
              const v = e.target.value;
              set(p("preset"), v);
              Object.entries(CAROUSEL_PRESETS[v]).forEach(([k, val]) => set(p(k), val));
            }}
          >
            {opt(["liquid", "ribbon", "vortex", "arch"]).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Select label="Intro" path={p("intro")} options={opt(["rise", "bloom", "spin", "deal", "none"])} />
        <Select label="Fit" path={p("fit")} options={opt(["natural", "portrait", "square", "landscape"])} />
        <Select label="Curl" path={p("curl")} options={opt(["twist", "rise", "fall"])} />
      </div>
      <div style={row}>
        <Slider label="Box height" path={p("height")} min={320} max={900} step={10} unit="px" />
        <Slider label="Card height" path={p("cardHeight")} min={0.2} max={0.9} step={0.01} />
        <Slider label="Gap" path={p("gap")} min={0} max={60} step={1} unit="px" />
        <Slider label="Radius" path={p("radius")} min={0} max={60} step={1} unit="px" />
        <Slider label="Lens width" path={p("lensWidth")} min={0.2} max={2} step={0.01} />
        <Slider label="Lens height" path={p("lensHeight")} min={0.2} max={2} step={0.01} />
        <Slider label="Tilt" path={p("tilt")} min={0} max={90} step={1} unit="°" />
        <Slider label="Roundness" path={p("roundness")} min={0} max={1} step={0.01} />
        <Slider label="Bend" path={p("bend")} min={0} max={1} step={0.01} />
        <Slider label="Reach" path={p("reach")} min={0.05} max={1} step={0.01} />
        <Slider label="Dispersion" path={p("dispersion")} min={0} max={1} step={0.01} />
        <Slider label="Liquid" path={p("liquid")} min={0} max={1} step={0.01} />
        <Slider label="Squeeze" path={p("squeeze")} min={0} max={1} step={0.01} />
        <Slider label="Autoplay interval" path={p("interval")} min={1} max={10} step={0.5} unit="s" />
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Toggle label="Follow cursor" path={p("followCursor")} />
        <Toggle label="Zoom card on click" path={p("focusOnClick")} />
        <Toggle label="Autoplay" path={p("autoplay")} />
        <Toggle label="Captions" path={p("captions")} />
        <Toggle label="Mouse wheel moves cards" path={p("captureWheel")} />
      </div>
    </Group>
  );
}

function HoloSettings() {
  const { draft } = useCtx();
  const { data: templates } = useTemplates();
  const h = draft.store.holo;
  const chosen = templates.find((t) => t.id === h.featuredId) ?? templates[0];
  const image = chosen ? chosen.cover || monogramCover(chosen) : undefined;
  return (
    <Group title="Hero card (Premium Templates, right side)">
      <p style={{ ...hint, marginBottom: 12 }}>The shiny tilting card next to your store title. Move your mouse over it to test. Card size makes it bigger or smaller (the preview shows up to 360px).</p>
      <div style={{ display: "flex", justifyContent: "center", padding: "18px 0 28px" }}>
        {image && (
          <HoloCard
            key={h.preset}
            image={image}
            alt={chosen?.name ?? ""}
            preset={h.preset}
            foilColor={h.foilColor}
            intensity={h.intensity}
            scale={h.scale}
            edgeSparkle={h.edgeSparkle}
            frame={h.frame}
            glare={h.glare}
            tiltMax={h.tiltMax}
            hoverScale={h.hoverScale}
            radius={h.radius}
            width={Math.min(h.width, 360)}
            idle={h.idle}
            shadow={h.shadow}
          />
        )}
      </div>
      <Toggle label="Show this shiny card (turn off to show the normal card)" path={["store", "holo", "enabled"]} />
      <div style={row}>
        <Select
          label="Template on the card"
          path={["store", "holo", "featuredId"]}
          options={[{ value: "", label: "Automatic (bestseller)" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]}
        />
        <Select
          label="Style"
          path={["store", "holo", "preset"]}
          options={["bursts", "stars", "shards", "cosmos", "rainbow", "swirl", "glitter", "gold"].map((v) => ({
            value: v,
            label: v.charAt(0).toUpperCase() + v.slice(1),
          }))}
        />
        <ColorField label="Foil colour" path={["store", "holo", "foilColor"]} />
      </div>
      <div style={row}>
        <Slider label="Intensity" path={["store", "holo", "intensity"]} min={0} max={1} step={0.01} />
        <Slider label="Scale" path={["store", "holo", "scale"]} min={0.25} max={4} step={0.05} />
        <Slider label="Edge sparkle" path={["store", "holo", "edgeSparkle"]} min={0} max={1} step={0.01} />
        <Slider label="Frame" path={["store", "holo", "frame"]} min={0} max={20} step={1} unit="%" />
        <Slider label="Glare" path={["store", "holo", "glare"]} min={0} max={1} step={0.01} />
        <Slider label="Tilt" path={["store", "holo", "tiltMax"]} min={0} max={45} step={1} unit="°" />
        <Slider label="Hover scale" path={["store", "holo", "hoverScale"]} min={0.8} max={1.3} step={0.01} />
        <Slider label="Corner radius" path={["store", "holo", "radius"]} min={0} max={40} step={1} unit="px" />
        <Slider label="Card size (width)" path={["store", "holo", "width"]} min={160} max={560} step={1} unit="px" />
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Toggle label="Idle shimmer" path={["store", "holo", "idle"]} />
        <Toggle label="Shadow" path={["store", "holo", "shadow"]} />
      </div>
    </Group>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="admin-card" style={{ marginBottom: 18 }}>
      <div className="admin-card-title" style={{ marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Paragraphs({ path }: { path: Path }) {
  const { draft, set } = useCtx();
  const list = (getAt(draft, path) as string[]) ?? [];
  return (
    <>
      {list.map((t, i) => (
        <div key={i} style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <b>Paragraph {i + 1}</b>
            <button type="button" className="admin-btn-small danger" onClick={() => set(path, list.filter((_, k) => k !== i))}>
              Remove
            </button>
          </div>
          <textarea
            className="admin-textarea"
            rows={4}
            value={t}
            onChange={(e) => set(path, list.map((x, k) => (k === i ? e.target.value : x)))}
          />
        </div>
      ))}
      <button type="button" className="admin-btn-ghost" onClick={() => set(path, [...list, ""])}>
        + Add paragraph
      </button>
    </>
  );
}

function Items({
  path,
  fields,
  blank,
  addLabel,
  titleOf,
}: {
  path: Path;
  fields: { key: string; label: string; tags?: boolean }[];
  blank: Record<string, unknown>;
  addLabel: string;
  titleOf: (item: Record<string, unknown>, i: number) => string;
}) {
  const { draft, set } = useCtx();
  const list = (getAt(draft, path) as Record<string, unknown>[]) ?? [];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    set(path, next);
  };
  return (
    <>
      {list.map((item, i) => (
        <div key={i} style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <b>{titleOf(item, i) || `Item ${i + 1}`}</b>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="admin-btn-small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="admin-btn-small" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="admin-btn-small danger" onClick={() => set(path, list.filter((_, k) => k !== i))}>Remove</button>
            </div>
          </div>
          <div style={row}>
            {fields.map((f) => (
              <div className="admin-field" key={f.key} style={{ marginBottom: 6, gridColumn: f.tags ? "1 / -1" : undefined }}>
                <label className="admin-label">{f.label}</label>
                {f.tags ? (
                  <ListField list={(item[f.key] as string[]) ?? []} onChange={(n) => set([...path, i, f.key], n)} sep="," rows={2} />
                ) : (
                  <input className="admin-input" value={String(item[f.key] ?? "")} onChange={(e) => set([...path, i, f.key], e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="admin-btn-ghost" onClick={() => set(path, [...list, structuredClone(blank)])}>
        + {addLabel}
      </button>
    </>
  );
}

export function SiteContentPanel() {
  const [saved, setSaved] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [draft, setDraft] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [section, setSection] = useState<Section>("intro");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSiteContent(true).then((c) => {
      setSaved(c);
      setDraft(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const set = (path: Path, value: unknown) =>
    setDraft((d) => {
      const next = structuredClone(d) as unknown as Record<string | number, unknown>;
      let o = next;
      for (let i = 0; i < path.length - 1; i++) o = o[path[i]] as Record<string | number, unknown>;
      o[path[path.length - 1]] = value;
      return next as unknown as SiteContent;
    });

  async function save() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from("site_content")
      .upsert({ id: 1, data: draft, updated_at: new Date().toISOString() });
    setBusy(false);
    if (err) {
      setError(
        /relation|does not exist|schema cache/i.test(err.message)
          ? "The site_content table is missing. Run supabase/site-content.sql in the Supabase SQL Editor once, then try again."
          : err.message,
      );
      return;
    }
    setSaved(draft);
    setSiteContentCache(draft);
    setNotice("Saved. Your website now shows this.");
  }

  const bold = "Tip: put **two stars** around words to make them bold.";

  return (
    <Ctx.Provider value={{ draft, set }}>
    <div>
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">Site Content</h2>
          <p className="admin-section-desc">
            Edit the text of your portfolio and store: intro, about, skills, education, contact and store headings.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={section === s.key ? "admin-btn-primary" : "admin-btn-ghost"}
            onClick={() => setSection(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {loading && <p className="admin-dim">Loading…</p>}

      {!loading && section === "intro" && (
        <>
          <Group title="Top bar">
            <div style={row}>
              <Text label="Logo text" path={["nav", "logo"]} />
              <Text label="Store button" path={["nav", "storeButton"]} />
            </div>
          </Group>
          <Group title="Hero">
            <div style={row}>
              <Text label="Small badge text" path={["hero", "badge"]} />
              <Text label="Section label" path={["hero", "number"]} />
              <Text label="Big name (animated)" path={["hero", "firstName"]} help="Short names look best. Capital letters are used." />
              <Text label="Last name (faded)" path={["hero", "lastName"]} />
              <Text label="Photo wall starts at letter" path={["hero", "wallLetter"]} help="One letter of the big name. Leave as S to keep it as now." />
            </div>
            <Lines label="Typing roles (one per line)" path={["hero", "roles"]} rows={4} />
            <Text label="Description" path={["hero", "description"]} multiline help={bold} />
            <div style={row}>
              <Text label="First button" path={["hero", "primaryButton"]} />
              <Text label="Store button" path={["hero", "storeButton"]} />
            </div>
          </Group>
          <Group title="Scrolling tech strip">
            <Lines label="Items (one per line)" path={["marquee"]} rows={8} />
          </Group>
        </>
      )}

      {!loading && section === "about" && (
        <>
          <Group title="Heading">
            <div style={row}>
              <Text label="Section label" path={["about", "label"]} />
              <Text label="Line 1" path={["about", "titleTop"]} />
              <Text label="Line 2" path={["about", "titleBottom"]} />
              <Text label="Line 2 (highlighted)" path={["about", "titleEm"]} />
            </div>
          </Group>
          <Group title="Numbers">
            <Items
              path={["about", "stats"]}
              fields={[{ key: "num", label: "Number" }, { key: "label", label: "Label" }]}
              blank={{ num: "", label: "" }}
              addLabel="Add number"
              titleOf={(s) => `${s.num ?? ""} ${s.label ?? ""}`}
            />
          </Group>
          <Group title="Paragraphs">
            <p style={{ ...hint, marginBottom: 12 }}>{bold}</p>
            <Paragraphs path={["about", "paragraphs"]} />
          </Group>
        </>
      )}

      {!loading && section === "skills" && (
        <>
          <Group title="Heading">
            <div style={row}>
              <Text label="Section label" path={["skills", "label"]} />
              <Text label="Title line 1" path={["skills", "titleTop"]} />
              <Text label="Title line 2" path={["skills", "titleBottom"]} />
            </div>
            <Text label="Description" path={["skills", "description"]} multiline />
          </Group>
          <Group title="Skill groups">
            <Items
              path={["skills", "groups"]}
              fields={[{ key: "label", label: "Group name" }, { key: "tags", label: "Skills (separate with commas)", tags: true }]}
              blank={{ label: "New group", tags: [] }}
              addLabel="Add group"
              titleOf={(g) => String(g.label ?? "")}
            />
          </Group>
        </>
      )}

      {!loading && section === "more" && (
        <>
          <Group title="Projects section heading">
            <p style={{ ...hint, marginBottom: 12 }}>The projects themselves are edited in the Projects tab.</p>
            <div style={row}>
              <Text label="Section label" path={["projects", "label"]} />
              <Text label="Title line 1" path={["projects", "titleTop"]} />
              <Text label="Title line 2" path={["projects", "titleEm"]} />
              <Text label="GitHub link" path={["projects", "githubUrl"]} />
              <Text label="GitHub button text" path={["projects", "allButton"]} />
            </div>
          </Group>
          <Group title="Education heading">
            <div style={row}>
              <Text label="Section label" path={["education", "label"]} />
              <Text label="Title line 1" path={["education", "titleTop"]} />
              <Text label="Title line 2" path={["education", "titleEm"]} />
            </div>
          </Group>
          <Group title="Education list">
            <Items
              path={["education", "items"]}
              fields={[
                { key: "year", label: "Year" },
                { key: "degree", label: "Degree / course" },
                { key: "note", label: "Small note (optional)" },
                { key: "school", label: "School / college" },
                { key: "score", label: "Score / status" },
              ]}
              blank={{ year: "", degree: "", note: "", school: "", score: "" }}
              addLabel="Add education"
              titleOf={(e) => String(e.degree ?? "")}
            />
          </Group>
        </>
      )}

      {!loading && section === "contact" && (
        <>
          <Group title="Heading">
            <div style={row}>
              <Text label="Section label" path={["contact", "label"]} />
              <Text label="Heading" path={["contact", "heading"]} />
            </div>
            <Text label="Text below heading" path={["contact", "text"]} multiline />
          </Group>
          <Group title="Details">
            <div style={row}>
              <Text label="Email" path={["contact", "email"]} />
              <Text label="City (local time)" path={["contact", "city"]} />
              <Text label="Resume link" path={["contact", "resumeUrl"]} help="Upload resume.pdf in the public folder, or paste any link." />
              <Text label="LinkedIn link" path={["contact", "linkedinUrl"]} />
              <Text label="Footer name" path={["contact", "footerName"]} />
            </div>
          </Group>
          <Group title="Social links">
            <Items
              path={["contact", "socials"]}
              fields={[{ key: "label", label: "Name" }, { key: "href", label: "Link" }]}
              blank={{ label: "", href: "https://" }}
              addLabel="Add link"
              titleOf={(s) => String(s.label ?? "")}
            />
          </Group>
          <Group title="Availability card & closing">
            <div style={row}>
              <Text label="Small green label" path={["contact", "availableText"]} />
              <Text label="Card title" path={["contact", "availableTitle"]} />
              <Text label="Card tags" path={["contact", "availableTags"]} />
              <Text label="Closing heading" path={["contact", "closingTitle"]} />
              <Text label="Resume button" path={["contact", "resumeButton"]} />
              <Text label="LinkedIn button" path={["contact", "linkedinButton"]} />
            </div>
          </Group>
        </>
      )}

      {!loading && section === "store" && (
        <>
          <HoloSettings />
          <CarouselSettings />
          <Group title="Store header & hero">
            <p style={{ ...hint, marginBottom: 12 }}>Templates, products, resources and services are edited in their own tabs.</p>
            <div style={row}>
              <Text label="Logo text" path={["store", "logo"]} />
              <Text label="Logo small text" path={["store", "logoSub"]} />
              <Text label="Small label" path={["store", "eyebrow"]} />
              <Text label="Title line 1" path={["store", "titleTop"]} />
              <Text label="Title line 2 (highlighted)" path={["store", "titleEm"]} />
              <Text label="Browse button" path={["store", "browseButton"]} />
              <Text label="WhatsApp button" path={["store", "whatsappButton"]} />
            </div>
            <Text label="Description" path={["store", "description"]} multiline />
          </Group>
          <Group title="WhatsApp number for orders">
            <Text
              label="Number (country code + number, digits only)"
              path={["store", "whatsappNumber"]}
              help="Example: 916206358342. Buy Now and Hire Me buttons open this chat."
            />
          </Group>
          <Group title="Section headings">
            {(["templates", "products", "resources", "services", "contact"] as const).map((k) => (
              <div key={k} style={box}>
                <b style={{ textTransform: "capitalize" }}>{k}</b>
                <div style={{ ...row, marginTop: 10 }}>
                  <Text label="Small label" path={["store", "sections", k, "label"]} />
                  <Text label="Title" path={["store", "sections", k, "top"]} />
                  <Text label="Title (highlighted)" path={["store", "sections", k, "em"]} />
                </div>
              </div>
            ))}
          </Group>
          <Group title="Contact tiles">
            <Items
              path={["store", "contacts"]}
              fields={[
                { key: "label", label: "Name" },
                { key: "value", label: "Shown text" },
                { key: "href", label: "Link" },
              ]}
              blank={{ label: "", value: "", href: "https://" }}
              addLabel="Add contact"
              titleOf={(c) => String(c.label ?? "")}
            />
          </Group>
          <Group title="Footer">
            <Text label="Footer text" path={["store", "footer"]} help="{year} becomes the current year." />
          </Group>
        </>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
        <button className="admin-btn-primary" disabled={busy || !dirty} onClick={save}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button className="admin-btn-ghost" disabled={busy || !dirty} onClick={() => setDraft(saved)}>
          Undo changes
        </button>
        <button
          className="admin-btn-ghost"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Fill every field with the original text? You still need to press Save.")) {
              setDraft(DEFAULT_SITE_CONTENT);
            }
          }}
        >
          Reset to default
        </button>
        <span className="admin-dim">{dirty ? "You have unsaved changes." : notice ?? "No changes."}</span>
      </div>
    </div>
    </Ctx.Provider>
  );
}