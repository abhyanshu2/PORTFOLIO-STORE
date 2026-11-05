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

type Filter = "all" | "unread" | "read";

function fmtDate(s: string) {
  return new Date(s).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessagesPanel() {
  const [rows, setRows] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

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
    setRows((r) => r.map((m) => (m.id === id ? { ...m, read: !read } : m)));
    const { error: err } = await supabase
      .from("contact_messages")
      .update({ read: !read })
      .eq("id", id);
    if (err) {
      setError(err.message);
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this message? This can't be undone.")) return;
    const { error: err } = await supabase.from("contact_messages").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    load();
  }

  const unread = rows.filter((m) => !m.read).length;
  const shown =
    filter === "all" ? rows : rows.filter((m) => (filter === "unread" ? !m.read : m.read));

  return (
    <div>
      <div className="admin-section-head">
        <div>
          <h2 className="admin-section-title">
            Messages
            <span className="admin-section-count">{rows.length}</span>
          </h2>
          <p className="admin-section-desc">
            Messages sent from the contact form on your portfolio. Unread ones have an orange edge.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading messages…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          No messages yet. They show up here automatically when someone submits the contact form on
          your portfolio.
        </div>
      ) : (
        <>
          <div className="admin-chips">
            {(
              [
                ["all", `All (${rows.length})`],
                ["unread", `Unread (${unread})`],
                ["read", `Read (${rows.length - unread})`],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`admin-chip${filter === f ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {shown.length === 0 && <div className="admin-empty">No {filter} messages.</div>}

          {shown.map((m) => (
            <div key={m.id} className={`admin-card${m.read ? "" : " unread"}`}>
              <div className="admin-card-top">
                <div className="admin-person">
                  <div className="admin-avatar" aria-hidden="true">
                    {(m.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="admin-card-title">
                      {m.name}
                      {!m.read && <span className="admin-unread-dot" title="Unread" />}
                    </div>
                    <div className="admin-card-meta">
                      <a href={`mailto:${m.email}`}>{m.email}</a> · {fmtDate(m.created_at)}
                    </div>
                    <p className="admin-card-body">{m.message}</p>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message")}`}
                    className="admin-btn-small"
                  >
                    Reply by email
                  </a>
                  <button onClick={() => toggleRead(m.id, m.read)} className="admin-btn-small">
                    {m.read ? "Mark as unread" : "Mark as read"}
                  </button>
                  <button onClick={() => remove(m.id)} className="admin-btn-small danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}