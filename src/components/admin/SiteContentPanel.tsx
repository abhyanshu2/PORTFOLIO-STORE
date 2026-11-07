import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
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