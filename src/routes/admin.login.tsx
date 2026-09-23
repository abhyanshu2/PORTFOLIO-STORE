import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Login" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="admin-login-wrap">
      <Link
        to="/"
        aria-label="Close"
        style={{
          position: "absolute",
          top: 22,
          right: 26,
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1px solid var(--border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          textDecoration: "none",
          fontSize: 16,
          zIndex: 2,
        }}
      >
        ✕
      </Link>
      <form onSubmit={handleSubmit} className="admin-login-card">
        <div className="admin-login-mark">CUSTOM ID STUDIO</div>
        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-sub">Sign in to manage templates, products, orders & messages.</p>

        <div className="admin-field">
          <label className="admin-label">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-input"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="admin-field">
          <label className="admin-label">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="admin-error">{error}</p>}

        <button type="submit" disabled={loading} className="admin-btn-primary" style={{ width: "100%", marginTop: 6 }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}