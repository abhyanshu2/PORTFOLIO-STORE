import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function MessagesPanel() {
  const [rows, setRows] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setRows((data as Message[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRead(id: string, read: boolean) {
    await supabase.from("contact_messages").update({ read: !read }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <div className="admin-section-head">
        <h2 className="admin-section-title">
          Messages <span className="admin-section-count">({rows.length})</span>
        </h2>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <div className="admin-empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">No messages yet — these show up automatically when someone submits your portfolio's contact form.</div>
      ) : (
        <div>
          {rows.map((m) => (
            <div key={m.id} className={`admin-card${m.read ? "" : " unread"}`}>
              <div className="admin-card-top">
                <div>
                  <div className="admin-card-title">
                    {m.name}
                    {!m.read && <span className="admin-unread-dot" />}
                  </div>
                  <div className="admin-card-meta">
                    {m.email} · {new Date(m.created_at).toLocaleString()}
                  </div>
                  <p className="admin-card-body">{m.message}</p>
                </div>
                <div className="admin-card-actions">
                  <button onClick={() => toggleRead(m.id, m.read)} className="admin-btn-small">
                    {m.read ? "Mark unread" : "Mark read"}
                  </button>
                  <button onClick={() => remove(m.id)} className="admin-btn-small danger">
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