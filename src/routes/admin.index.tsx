import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Images,
  LayoutTemplate,
  LogOut,
  Mail,
  Package,
  ShoppingCart,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
} from "lucide-react";
import { useAdminSession } from "@/lib/use-admin-session";
import { supabase } from "@/lib/supabase";
import { CrudTable } from "@/components/admin/CrudTable";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { DriftPanel } from "@/components/admin/DriftPanel";
import { SiteContentPanel } from "@/components/admin/SiteContentPanel";
import {
  TEMPLATES_CONFIG,
  MY_PRODUCTS_CONFIG,
  RESOURCES_CONFIG,
  SERVICES_CONFIG,
  PORTFOLIO_PROJECTS_CONFIG,
  EXPERIENCE_CONFIG,
} from "@/lib/admin-schemas";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Dashboard" }],
  }),
  component: AdminDashboardPage,
});

type TabDef = {
  key: string;
  label: string;
  group: "Portfolio" | "Store" | "Inbox";
  icon: ComponentType<{ className?: string }>;
  desc: string;
};

const TABS = [
  {
    key: "content",
    label: "Site Content",
    group: "Portfolio",
    icon: FileText,
    desc: "Edit the text of your intro, about, skills, education, contact and store.",
  },
  {
    key: "projects",
    label: "Projects",
    group: "Portfolio",
    icon: FolderOpen,
    desc: "Projects shown in the Selected Work section of your portfolio.",
  },
  {
    key: "experience",
    label: "Experience",
    group: "Portfolio",
    icon: Briefcase,
    desc: "Jobs, internships and roles shown in the Experience section.",
  },
  {
    key: "drift",
    label: "Hero Wall",
    group: "Portfolio",
    icon: Images,
    desc: "The photo wall behind your name on the homepage.",
  },
  {
    key: "templates",
    label: "Templates",
    group: "Store",
    icon: LayoutTemplate,
    desc: "Templates people can preview and buy in your store.",
  },
  {
    key: "products",
    label: "My Products",
    group: "Store",
    icon: Package,
    desc: "Apps and tools you have built. Mark them Live or Coming soon.",
  },
  {
    key: "resources",
    label: "Free Resources",
    group: "Store",
    icon: Download,
    desc: "Free downloads and guides offered in the store.",
  },
  {
    key: "services",
    label: "Services",
    group: "Store",
    icon: Wrench,
    desc: "Services people can hire you for, with price and what is included.",
  },
  {
    key: "orders",
    label: "Orders",
    group: "Inbox",
    icon: ShoppingCart,
    desc: "Every Buy Now or Hire Me click from your store is saved here.",
  },
  {
    key: "messages",
    label: "Messages",
    group: "Inbox",
    icon: Mail,
    desc: "Messages sent from the contact form on your portfolio.",
  },
] as const satisfies readonly TabDef[];

type TabKey = (typeof TABS)[number]["key"];
const GROUPS = ["Portfolio", "Store", "Inbox"] as const;

function AdminDashboardPage() {
  const { session, loading, isAdmin } = useAdminSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("projects");
  const [counts, setCounts] = useState({ orders: 0, messages: 0 });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("admin-side-collapsed") === "1");
    } catch {}
  }, []);

  const toggleSide = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("admin-side-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const [o, m] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase
          .from("contact_messages")
          .select("id", { count: "exact", head: true })
          .eq("read", false),
      ]);
      if (!cancelled) setCounts({ orders: o.count ?? 0, messages: m.count ?? 0 });
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, tab]);

  if (loading) return <FullscreenMsg text="Checking your session…" />;
  if (!isAdmin) return <FullscreenMsg text="Redirecting to login…" />;

  const current = TABS.find((t) => t.key === tab)!;
  const badgeFor = (key: string) =>
    key === "orders" ? counts.orders : key === "messages" ? counts.messages : 0;

  return (
    <div className={`admin-shell${collapsed ? " side-collapsed" : ""}`}>
      <aside className="admin-side">
        <div className="admin-brand">
          <div className="admin-brand-mark">A</div>
          <div>
            <div className="admin-brand-name">Admin Panel</div>
            <div className="admin-brand-sub">Abhyanshu Raj</div>
          </div>
        </div>

        <div className="admin-nav" role="navigation" aria-label="Admin sections">
          {GROUPS.map((g) => (
            <div key={g} className="admin-nav-section">
              <div className="admin-nav-group">{g}</div>
              {TABS.filter((t) => t.group === g).map((t) => {
                const Icon = t.icon;
                const badge = badgeFor(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`admin-nav-item${tab === t.key ? " active" : ""}`}
                    aria-current={tab === t.key ? "page" : undefined}
                  >
                    <Icon />
                    {t.label}
                    {badge > 0 && <span className="admin-nav-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-side-toggle"
              onClick={toggleSide}
              aria-label={collapsed ? "Open admin panel" : "Close admin panel"}
              title={collapsed ? "Open admin panel" : "Close admin panel"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <div className="admin-crumb">
              Admin / <b>{current.label}</b>
            </div>
          </div>
          <div className="admin-top-actions">
            <span className="admin-user">{session?.user.email}</span>
            <Link to="/" className="admin-btn-ghost">
              <ExternalLink size={16} />
              View site
            </Link>
            <button onClick={() => supabase.auth.signOut()} className="admin-btn-ghost">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>

        <main className="admin-main">
          {tab === "projects" && (
            <CrudTable config={PORTFOLIO_PROJECTS_CONFIG} description={current.desc} />
          )}
          {tab === "experience" && (
            <CrudTable config={EXPERIENCE_CONFIG} description={current.desc} />
          )}
          {tab === "templates" && (
            <CrudTable config={TEMPLATES_CONFIG} description={current.desc} />
          )}
          {tab === "products" && (
            <CrudTable config={MY_PRODUCTS_CONFIG} description={current.desc} />
          )}
          {tab === "resources" && (
            <CrudTable config={RESOURCES_CONFIG} description={current.desc} />
          )}
          {tab === "services" && (
            <CrudTable config={SERVICES_CONFIG} description={current.desc} />
          )}
          {tab === "content" && <SiteContentPanel />}
          {tab === "drift" && <DriftPanel />}
          {tab === "orders" && <OrdersPanel />}
          {tab === "messages" && <MessagesPanel />}
        </main>
      </div>
    </div>
  );
}

function FullscreenMsg({ text }: { text: string }) {
  return (
    <div
      className="admin-shell"
      style={{
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        color: "var(--muted)",
      }}
    >
      {text}
    </div>
  );
}