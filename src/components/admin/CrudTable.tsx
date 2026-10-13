import { useEffect, useState, type FormEvent } from "react";
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

export function CrudTable({ config }: { config: TableConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    let query = supabase.from(config.table).select("*");
    if (config.orderBy) query = query.order(config.orderBy, { ascending: true });
    const { data, error: err } = await query;
    if (err) setError(err.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.table]);

  function openAdd() {
    setEditingRow(null);
    const initial: Record<string, string> = {};
    config.fields.forEach((f) => {
      initial[f.key] = f.type === "select" ? f.options?.[0] ?? "" : "";
    });
    setFormValues(initial);
    setFormOpen(true);
  }

  function openEdit(row: Row) {
    setEditingRow(row);
    const initial: Record<string, string> = {};
    config.fields.forEach((f) => {
      const v = row[f.key];
      initial[f.key] = f.type === "array" || f.type === "image-array" ? toArrayInput(v) : (v ?? "").toString();
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
          const existing = v[key] ? v[key].split(",").map((s) => s.trim()).filter(Boolean) : [];
          return { ...v, [key]: [...existing, ...urls].join(", ") };
        }
        return { ...v, [key]: urls[0] };
      });
    } catch (err: any) {
      setError(err.message || "Upload failed — please try again.");
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
      else if (f.type === "number") payload[f.key] = raw === "" ? null : Number(raw);
      else payload[f.key] = raw === "" ? null : raw;
    }
    const res = editingRow
      ? await supabase.from(config.table).update(payload).eq(config.primaryKey, editingRow[config.primaryKey])
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
    if (!confirm(`Delete "${row.name ?? row[config.primaryKey]}"? This can't be undone.`)) return;
    setDeletingId(row[config.primaryKey]);
    const { error: err } = await supabase.from(config.table).delete().eq(config.primaryKey, row[config.primaryKey]);
    setDeletingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    load();
  }

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="admin-section-title">
          {config.title}
          <span className="admin-section-count">({rows.length})</span>
        </h2>
        {!config.noAddDelete && (
          <button onClick={openAdd} className="admin-btn-primary">
            + Add {config.singular}
          </button>
        )}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">No rows yet — add your first one.</div>
      ) : (
        <>
          <div className="admin-table-wrap admin-table-desktop">
            <table className="admin-table">
              <thead>
                <tr>
                  {config.listColumns.map((col) => (
                    <th key={col}>{col.replace(/_/g, " ")}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[config.primaryKey]}>
                    {config.listColumns.map((col) => (
                      <td key={col}>{Array.isArray(row[col]) ? row[col].join(", ") : String(row[col] ?? "—")}</td>
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
                          {deletingId === row[config.primaryKey] ? "…" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-cards-mobile">
            {rows.map((row) => (
              <div key={row[config.primaryKey]} className="admin-card">
                <div className="admin-card-title" style={{ marginBottom: 10 }}>
                  {row.name ?? row[config.primaryKey]}
                </div>
                {config.listColumns
                  .filter((c) => c !== "name")
                  .map((col) => (
                    <div key={col} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderTop: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{col.replace(/_/g, " ")}</span>
                      <span style={{ color: "var(--text)", textAlign: "right" }}>
                        {Array.isArray(row[col]) ? row[col].join(", ") : String(row[col] ?? "—")}
                      </span>
                    </div>
                  ))}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button onClick={() => openEdit(row)} className="admin-btn-small" style={{ flex: 1 }}>
                    Edit
                  </button>
                  {!config.noAddDelete && (
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row[config.primaryKey]}
                      className="admin-btn-small danger"
                      style={{ flex: 1 }}
                    >
                      {deletingId === row[config.primaryKey] ? "…" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {formOpen && (
        <div className="admin-overlay" onClick={closeForm}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSave} className="admin-modal">
            <h3 className="admin-modal-title">{editingRow ? `Edit ${config.singular}` : `Add ${config.singular}`}</h3>
            {error && <div className="admin-error">{error}</div>}
            {config.fields.map((f) => (
              <div key={f.key} className="admin-field">
                <label className="admin-label">
                  {f.label}
                  {f.required && " *"}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    required={f.required}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    rows={3}
                    className="admin-textarea"
                  />
                ) : f.type === "select" ? (
                  <select
                    required={f.required}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="admin-select"
                  >
                    {f.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "— none —"}
                      </option>
                    ))}
                  </select>
                ) : f.type === "image" || f.type === "video" ? (
                  <div>
                    <input
                      type="url"
                      placeholder={f.type === "image" ? "Paste an image URL, or upload below" : "Paste a video URL, or upload below"}
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="admin-input"
                      style={{ marginBottom: 8 }}
                    />
                    <label className="admin-btn-small" style={{ display: "inline-block", cursor: "pointer" }}>
                      {uploading[f.key] ? "Uploading…" : `Upload ${f.type === "image" ? "Image" : "Video"}`}
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
                        style={{ display: "block", marginTop: 10, maxHeight: 90, borderRadius: 8, border: "1px solid var(--border-strong)" }}
                      />
                    )}
                    {f.type === "video" && formValues[f.key] && (
                      <video src={formValues[f.key]} controls style={{ display: "block", marginTop: 10, maxHeight: 120, borderRadius: 8, width: "100%" }} />
                    )}
                  </div>
                ) : f.type === "image-array" ? (
                  <div>
                    <textarea
                      value={formValues[f.key] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      rows={2}
                      placeholder="Comma-separated URLs, or upload below"
                      className="admin-textarea"
                      style={{ marginBottom: 8 }}
                    />
                    <label className="admin-btn-small" style={{ display: "inline-block", cursor: "pointer" }}>
                      {uploading[f.key] ? "Uploading…" : "+ Upload Images"}
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
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        {formValues[f.key]
                          .split(",")
                          .map((u) => u.trim())
                          .filter(Boolean)
                          .map((u, i) => (
                            <img
                              key={i}
                              src={u}
                              alt=""
                              style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border-strong)" }}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                    required={f.required}
                    disabled={!!editingRow && f.key === config.primaryKey}
                    placeholder={f.placeholder}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="admin-input"
                  />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button type="button" onClick={closeForm} className="admin-btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="admin-btn-primary">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}