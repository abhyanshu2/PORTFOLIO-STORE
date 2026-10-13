import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminSession } from "@/lib/use-admin-session";
import { supabase } from "@/lib/supabase";
import { CrudTable } from "@/components/admin/CrudTable";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import {
  TEMPLATES_CONFIG,
  MY_PRODUCTS_CONFIG,
  RESOURCES_CONFIG,
  SERVICES_CONFIG,
  PORTFOLIO_PROJECTS_CONFIG,
} from "@/lib/admin-schemas";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard" }],
  }),
  component: AdminDashboardPage,
});

const TABS = [
  { key: "projects", label: "Portfolio Projects" },
  { key: "templates", label: "Templates" },
  { key: "products", label: "My Products" },
  { key: "resources", label: "Resources" },
  { key: "services", label: "Services" },
  { key: "orders", label: "Orders" },
  { key: "messages", label: "Messages" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function CategoryDropdown({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const current = TABS.find((t) => t.key === tab)!;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="admin-dropdown-wrap" ref={wrapRef}>
      <button className="admin-dropdown-btn" onClick={() => setOpen((v) => !v)}>
        {current.label}
        <span className={`admin-dropdown-caret${open ? " open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="admin-dropdown-menu">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setOpen(false);
              }}
              className={`admin-dropdown-item${tab === t.key ? " active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboardPage() {
  const { session, loading, isAdmin } = useAdminSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("projects");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) return <FullscreenMsg text="Checking session…" />;
  if (!isAdmin) return <FullscreenMsg text="Redirecting to login…" />;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <div className="admin-header-title">Admin Dashboard</div>
          <div className="admin-header-email">{session?.user.email}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CategoryDropdown tab={tab} setTab={setTab} />
          <button onClick={() => supabase.auth.signOut()} className="admin-btn-ghost">
            Sign Out
          </button>
        </div>
      </header>

      <main className="admin-main">
        {tab === "projects" && <CrudTable config={PORTFOLIO_PROJECTS_CONFIG} />}
        {tab === "templates" && <CrudTable config={TEMPLATES_CONFIG} />}
        {tab === "products" && <CrudTable config={MY_PRODUCTS_CONFIG} />}
        {tab === "resources" && <CrudTable config={RESOURCES_CONFIG} />}
        {tab === "services" && <CrudTable config={SERVICES_CONFIG} />}
        {tab === "orders" && <OrdersPanel />}
        {tab === "messages" && <MessagesPanel />}
      </main>
    </div>
  );
}

function FullscreenMsg({ text }: { text: string }) {
  return <div className="admin-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--muted)" }}>{text}</div>;
}