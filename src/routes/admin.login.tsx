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
  const [showPassword, setShowPassword] = useState(false);
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
      <Link to="/" className="admin-login-close">
        ← Back to site
      </Link>
      <form onSubmit={handleSubmit} className="admin-login-card">
        <div className="admin-login-mark">PORTFOLIO ADMIN</div>
        <h1 className="admin-login-title">Welcome back</h1>
        <p className="admin-login-sub">
          Sign in to manage your projects, store, orders and messages.
        </p>

        <div className="admin-field">
          <label className="admin-label" htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-input"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="admin-field">
          <label className="admin-label" htmlFor="login-password">
            Password
          </label>
          <div className="admin-pw">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="admin-btn-primary"
          style={{ width: "100%", marginTop: 6 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}