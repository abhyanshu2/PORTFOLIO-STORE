import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  item_type: string;
  item_id: string;
  item_name: string;
  price: string | null;
  buyer_name: string | null;
  buyer_contact: string | null;
  status: string;
  created_at: string;
};

type Filter = "all" | "new" | "contacted" | "closed";

const STATUS_TONE: Record<string, string> = {
  new: "warn",
  contacted: "info",
  closed: "ok",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function contactHref(contact: string) {
  if (contact.includes("@")) return `mailto:${contact}`;
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export function OrdersPanel() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setRows((data as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    setRows((r) => r.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error: err } = await supabase.from("orders").update({ status }).eq("id", id);
    if (err) {
      setError(err.message);
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this order? This can't be undone.")) return;
    const { error: err } = await supabase.from("orders").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    load();
  }

  const count = (s: string) => rows.filter((o) => o.status === s).length;
  const shown = filter === "all" ? rows : rows.filter((o) => o.status === filter);

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">
            Orders
            <span className="admin-section-count">{rows.length}</span>
          </h2>
          <p className="admin-section-desc">
            Every Buy Now or Hire Me click from your store is saved here. Change the status as you
            follow up with each person.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading orders…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          No orders yet. They show up here automatically when someone clicks Buy Now or Hire Me in
          the store.
        </div>
      ) : (
        <>
          <div className="admin-stats">
            <div className="admin-stat">
              <b>{rows.length}</b>
              <span>Total orders</span>
            </div>
            <div className="admin-stat">
              <b>{count("new")}</b>
              <span>New, not contacted</span>
            </div>
            <div className="admin-stat">
              <b>{count("contacted")}</b>
              <span>Contacted</span>
            </div>
            <div className="admin-stat">
              <b>{count("closed")}</b>
              <span>Closed</span>
            </div>
          </div>

          <div className="admin-chips">
            {(["all", "new", "contacted", "closed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`admin-chip${filter === f ? " active" : ""}`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {shown.length === 0 && <div className="admin-empty">No {filter} orders.</div>}

          {shown.map((o) => {
            const href = o.buyer_contact ? contactHref(o.buyer_contact) : null;
            return (
              <div key={o.id} className="admin-card">
                <div className="admin-card-top">
                  <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                    <div className="admin-card-title">{o.item_name}</div>
                    <div className="admin-pills" style={{ marginTop: 8 }}>
                      <span className="admin-pill">{o.item_type}</span>
                      {o.price && <span className="admin-pill">₹{o.price}</span>}
                      <span className={`admin-pill ${STATUS_TONE[o.status] ?? ""}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="admin-card-meta">Received {fmtDate(o.created_at)}</div>
                    {(o.buyer_name || o.buyer_contact) && (
                      <div className="admin-card-body" style={{ marginTop: 10 }}>
                        {o.buyer_name}
                        {o.buyer_contact &&
                          (href ? (
                            <>
                              {o.buyer_name ? " · " : ""}
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-link"
                              >
                                {o.buyer_contact}
                              </a>
                            </>
                          ) : (
                            ` · ${o.buyer_contact}`
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="admin-card-actions">
                    <label className="admin-hint" style={{ margin: 0 }} htmlFor={`st-${o.id}`}>
                      Status
                    </label>
                    <select
                      id={`st-${o.id}`}
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="admin-select-sm"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button onClick={() => remove(o.id)} className="admin-btn-small danger">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}