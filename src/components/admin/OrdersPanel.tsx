import { useEffect, useState, type CSSProperties } from "react";
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

export function OrdersPanel() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this order?")) return;
    await supabase.from("orders").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        Orders <span style={{ color: "rgba(245,242,236,0.4)", fontWeight: 400, fontSize: 13 }}>({rows.length})</span>
      </h2>
      {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div style={{ color: "rgba(245,242,236,0.5)", fontSize: 13 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "rgba(245,242,236,0.4)", fontSize: 13 }}>
          No orders yet — these show up automatically when someone clicks "Buy Now" in the store.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((o) => (
            <div key={o.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{o.item_name}</div>
                  <div style={{ fontSize: 11, color: "rgba(245,242,236,0.45)", marginTop: 3 }}>
                    {o.item_type}
                    {o.price ? ` · ₹${o.price}` : ""} · {new Date(o.created_at).toLocaleString()}
                  </div>
                  {(o.buyer_name || o.buyer_contact) && (
                    <div style={{ fontSize: 12, marginTop: 8, color: "rgba(245,242,236,0.7)" }}>
                      {o.buyer_name} {o.buyer_contact ? `· ${o.buyer_contact}` : ""}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} style={selectStyle}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={() => remove(o.id)} style={dangerBtn}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cardStyle: CSSProperties = {
  padding: "16px 18px",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.02)",
};
const selectStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "#1c1c1c",
  color: "#f5f2ec",
  fontSize: 12,
  fontFamily: "inherit",
};
const dangerBtn: CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,107,107,0.35)",
  background: "transparent",
  color: "#ff6b6b",
  fontSize: 11,
  cursor: "pointer",
};
