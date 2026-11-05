import { useEffect, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadMediaFile } from "@/lib/upload-media";
import type { TableConfig } from "@/lib/admin-schemas";

type Row = Record<string, any>;

function toArrayInput(val: string[] | null | undefined) {
  return (val || []).join(", ");
}
function fromArrayInput(val: string) {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toLinesInput(val: string[] | null | undefined) {
  return (val || []).join("\n");
}
function fromLinesInput(val: string) {
  return val
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const IMAGE_RE = /(\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$)|^data:image\//i;
const PILL_COLS = ["status", "badge", "category", "type"];

function pillTone(v: string) {
  const s = v.toLowerCase();
  if (["live", "current", "available", "published"].includes(s)) return "ok";
  if (["soon", "coming soon", "draft", "new"].includes(s)) return "warn";
  return "";
}

function humanize(col: string) {
  return col.replace(/_/g, " ");
}

function Cell({ col, value }: { col: string; value: any }) {
  if (value === null || value === undefined || value === "") {
    return <span className="admin-dim">-</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="admin-dim">-</span>;
    return (
      <div className="admin-pills">
        {value.slice(0, 3).map((v, i) => (
          <span key={i} className="admin-pill">
            {String(v)}
          </span>
        ))}
        {value.length > 3 && <span className="admin-pill">+{value.length - 3} more</span>}
      </div>
    );
  }
  const s = String(value);
  if (IMAGE_RE.test(s)) return <img className="admin-thumb" src={s} alt="" />;
  if (PILL_COLS.includes(col)) {
    return <span className={`admin-pill ${pillTone(s)}`}>{s}</span>;
  }
  if (/^https?:\/\//i.test(s)) {
    return (
      <a href={s} target="_blank" rel="noopener noreferrer" className="admin-link">
        {s.replace(/^https?:\/\/(www\.)?/i, "").slice(0, 38)}
        {s.length > 48 ? "…" : ""}
      </a>
    );
  }
  if (col === "price" && /^\d+(\.\d+)?$/.test(s)) return <>₹{s}</>;
  return (
    <span className="admin-clamp" title={s}>
      {s}
    </span>
  );
}

export function CrudTable({
  config,
  description,
}: {
  config: TableConfig;
  description?: string;
}) {
  const titleKey = config.titleKey ?? "name";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    let q = supabase.from(config.table).select("*");
    if (config.orderBy) q = q.order(config.orderBy, { ascending: true });
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table]);

  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [formOpen]);

  function openAdd() {
    setEditingRow(null);
    const initial: Record<string, string> = {};
    config.fields.forEach((f) => {
      initial[f.key] = f.type === "select" ? (f.options?.[0] ?? "") : "";
    });
    setFormValues(initial);
    setFormOpen(true);
  }

  function openEdit(row: Row) {
    setEditingRow(row);
    const initial: Record<string, string> = {};
    config.fields.forEach((f) => {
      const v = row[f.key];
      initial[f.key] =
        f.type === "array" || f.type === "image-array"
          ? toArrayInput(v)
          : f.type === "lines"
            ? toLinesInput(v)
            : (v ?? "").toString();
    });
    setFormValues(initial);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingRow(null);
  }

  async function handleFileUpload(key: string, files: FileList | null, multi: boolean) {
    if (!files || files.length === 0) return;
    setUploading((u) => ({ ...u, [key]: true }));
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadMediaFile(file));
      }
      setFormValues((v) => {
        if (multi) {
          const existing = v[key]
            ? v[key]
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
          return { ...v, [key]: [...existing, ...urls].join(", ") };
        }
        return { ...v, [key]: urls[0] };
      });
    } catch (err: any) {
      setError(err.message || "Upload failed, please try again.");
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Row = {};
    for (const f of config.fields) {
      const raw = formValues[f.key] ?? "";
      if (f.type === "array" || f.type === "image-array") payload[f.key] = fromArrayInput(raw);
      else if (f.type === "lines") payload[f.key] = fromLinesInput(raw);
      else if (f.type === "number") payload[f.key] = raw === "" ? null : Number(raw);
      else payload[f.key] = raw === "" ? null : raw;
    }
    const res = editingRow
      ? await supabase
          .from(config.table)
          .update(payload)
          .eq(config.primaryKey, editingRow[config.primaryKey])
      : await supabase.from(config.table).insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    closeForm();
    load();
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Delete "${row[titleKey] ?? row[config.primaryKey]}"? This can't be undone.`))
      return;
    setDeletingId(row[config.primaryKey]);
    const { error: err } = await supabase
      .from(config.table)
      .delete()
      .eq(config.primaryKey, row[config.primaryKey]);
    setDeletingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    load();
  }

  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter((row) =>
        config.listColumns.some((c) =>
          String(Array.isArray(row[c]) ? row[c].join(" ") : (row[c] ?? ""))
            .toLowerCase()
            .includes(q),
        ),
      )
    : rows;

  const setVal = (key: string, value: string) => setFormValues((v) => ({ ...v, [key]: value }));

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">
            {config.title}
            <span className="admin-section-count">{rows.length}</span>
          </h2>
          {description && <p className="admin-section-desc">{description}</p>}
        </div>
        {!config.noAddDelete && (
          <button onClick={openAdd} className="admin-btn-primary">
            + Add {config.singular}
          </button>
        )}
      </div>

      {error && !formOpen && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading {config.title.toLowerCase()}…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          Nothing here yet.
          {!config.noAddDelete && ` Click "Add ${config.singular}" to create your first one.`}
        </div>
      ) : (
        <>
          {rows.length > 5 && (
            <div className="admin-toolbar">
              <div className="admin-search">
                <Search />
                <input
                  type="search"
                  className="admin-input"
                  placeholder={`Search ${config.title.toLowerCase()}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={`Search ${config.title}`}
                />
              </div>
            </div>
          )}

          {shown.length === 0 ? (
            <div className="admin-empty">No results for "{query}".</div>
          ) : (
            <>
              <div className="admin-table-wrap admin-table-desktop">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {config.listColumns.map((col) => (
                        <th key={col}>{humanize(col)}</th>
                      ))}
                      <th aria-label="Actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((row) => (
                      <tr key={row[config.primaryKey]}>
                        {config.listColumns.map((col) => (
                          <td key={col} className={col === titleKey ? "admin-td-title" : undefined}>
                            <Cell col={col} value={row[col]} />
                          </td>
                        ))}
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button onClick={() => openEdit(row)} className="admin-btn-small">
                            Edit
                          </button>
                          {!config.noAddDelete && (
                            <button
                              onClick={() => handleDelete(row)}
                              disabled={deletingId === row[config.primaryKey]}
                              className="admin-btn-small danger"
                              style={{ marginLeft: 8 }}
                            >
                              {deletingId === row[config.primaryKey] ? "Deleting…" : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-cards-mobile">
                {shown.map((row) => (
                  <div key={row[config.primaryKey]} className="admin-card">
                    <div className="admin-card-title" style={{ marginBottom: 10 }}>
                      {row[titleKey] ?? row[config.primaryKey]}
                    </div>
                    {config.listColumns
                      .filter((c) => c !== titleKey)
                      .map((col) => (
                        <div key={col} className="admin-kv">
                          <span>{humanize(col)}</span>
                          <div>
                            <Cell col={col} value={row[col]} />
                          </div>
                        </div>
                      ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        onClick={() => openEdit(row)}
                        className="admin-btn-small"
                        style={{ flex: 1 }}
                      >
                        Edit
                      </button>
                      {!config.noAddDelete && (
                        <button
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row[config.primaryKey]}
                          className="admin-btn-small danger"
                          style={{ flex: 1 }}
                        >
                          {deletingId === row[config.primaryKey] ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {formOpen && (
        <div className="admin-overlay" onClick={closeForm}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="admin-modal">
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">
                {editingRow ? `Edit ${config.singular}` : `Add ${config.singular}`}
              </h3>
              <button type="button" className="admin-icon-btn" onClick={closeForm} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {error && <div className="admin-error">{error}</div>}
            {config.fields.map((f) => {
              const id = `field-${f.key}`;
              return (
                <div key={f.key} className="admin-field">
                  <label className="admin-label" htmlFor={id}>
                    {f.label}
                    {f.required && <span className="admin-req">*</span>}
                  </label>
                  {f.type === "textarea" || f.type === "lines" ? (
                    <>
                      <textarea
                        id={id}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={formValues[f.key] ?? ""}
                        onChange={(e) => setVal(f.key, e.target.value)}
                        rows={f.type === "lines" ? 5 : 3}
                        className="admin-textarea"
                      />
                      {f.type === "lines" && (
                        <div className="admin-hint">Write one item per line.</div>
                      )}
                    </>
                  ) : f.type === "select" ? (
                    <select
                      id={id}
                      required={f.required}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setVal(f.key, e.target.value)}
                      className="admin-select"
                    >
                      {f.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt || "None"}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "image" || f.type === "video" ? (
                    <div>
                      <input
                        id={id}
                        type="url"
                        placeholder={
                          f.type === "image"
                            ? "Paste an image link, or upload below"
                            : "Paste a video link, or upload below"
                        }
                        value={formValues[f.key] ?? ""}
                        onChange={(e) => setVal(f.key, e.target.value)}
                        className="admin-input"
                        style={{ marginBottom: 10 }}
                      />
                      <label
                        className="admin-btn-small"
                        style={{ display: "inline-flex", cursor: "pointer" }}
                      >
                        {uploading[f.key]
                          ? "Uploading…"
                          : `Upload ${f.type === "image" ? "image" : "video"}`}
                        <input
                          type="file"
                          accept={f.type === "image" ? "image/*" : "video/*"}
                          style={{ display: "none" }}
                          disabled={uploading[f.key]}
                          onChange={(e) => handleFileUpload(f.key, e.target.files, false)}
                        />
                      </label>
                      {f.type === "image" && formValues[f.key] && (
                        <img
                          src={formValues[f.key]}
                          alt=""
                          style={{
                            display: "block",
                            marginTop: 12,
                            maxHeight: 110,
                            borderRadius: 10,
                            border: "1px solid var(--border-strong)",
                          }}
                        />
                      )}
                      {f.type === "video" && formValues[f.key] && (
                        <video
                          src={formValues[f.key]}
                          controls
                          style={{
                            display: "block",
                            marginTop: 12,
                            maxHeight: 150,
                            borderRadius: 10,
                            width: "100%",
                          }}
                        />
                      )}
                    </div>
                  ) : f.type === "image-array" ? (
                    <div>
                      <textarea
                        id={id}
                        value={formValues[f.key] ?? ""}
                        onChange={(e) => setVal(f.key, e.target.value)}
                        rows={2}
                        placeholder="Image links separated by commas, or upload below"
                        className="admin-textarea"
                        style={{ marginBottom: 10 }}
                      />
                      <label
                        className="admin-btn-small"
                        style={{ display: "inline-flex", cursor: "pointer" }}
                      >
                        {uploading[f.key] ? "Uploading…" : "+ Upload images"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          disabled={uploading[f.key]}
                          onChange={(e) => handleFileUpload(f.key, e.target.files, true)}
                        />
                      </label>
                      {!!formValues[f.key] && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                          {formValues[f.key]
                            .split(",")
                            .map((u) => u.trim())
                            .filter(Boolean)
                            .map((u, i) => (
                              <img
                                key={i}
                                src={u}
                                alt=""
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid var(--border-strong)",
                                }}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <input
                        id={id}
                        type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                        required={f.required}
                        disabled={!!editingRow && f.key === config.primaryKey}
                        placeholder={f.placeholder}
                        value={formValues[f.key] ?? ""}
                        onChange={(e) => setVal(f.key, e.target.value)}
                        className="admin-input"
                      />
                      {f.type === "array" && (
                        <div className="admin-hint">Separate items with commas.</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <div className="admin-modal-foot">
              <button type="button" onClick={closeForm} className="admin-btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="admin-btn-primary">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}