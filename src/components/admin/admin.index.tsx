import { useEffect, useState, type CSSProperties } from "react";
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
} from "@/lib/admin-schemas";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard" }],
  }),
  component: AdminDashboardPage,
});

const TABS = [
  { key: "templates", label: "Templates" },
  { key: "products", label: "My Products" },
  { key: "resources", label: "Resources" },
  { key: "services", label: "Services" },
  { key: "orders", label: "Orders" },
  { key: "messages", label: "Messages" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function AdminDashboardPage() {
  const { session, loading, isAdmin } = useAdminSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("templates");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) return <FullscreenMsg text="Checking session…" />;
  if (!isAdmin) return <FullscreenMsg text="Redirecting to login…" />;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f2ec", fontFamily: "'Space Grotesk', sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 12, color: "rgba(245,242,236,0.5)" }}>{session?.user.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            padding: "8px 18px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "#f5f2ec",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </header>

      <nav
        style={{
          display: "flex",
          gap: 4,
          padding: "14px 28px 0",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          overflowX: "auto",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid #f5f2ec" : "2px solid transparent",
              color: tab === t.key ? "#f5f2ec" : "rgba(245,242,236,0.45)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 28, maxWidth: 1040, margin: "0 auto" }}>
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
  const style: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    color: "rgba(245,242,236,0.6)",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13,
  };
  return <div style={style}>{text}</div>;
}
