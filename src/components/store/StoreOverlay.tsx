import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CATEGORIES, type CategorySlug } from "@/data/store/categories";
import type { Template } from "@/data/store/templates";
import { STORE_CONTACT, buildHireMeUrl, buildWhatsAppUrl } from "@/data/store/contact";
import { useTemplates, useMyProducts, useResources, useServices } from "@/lib/use-store-data";
import { supabase } from "@/lib/supabase";

// Fire-and-forget: logs the click into the `orders` table (visible in the
// admin panel) and then opens the WhatsApp/hire link. If the insert fails
// for any reason (offline, RLS, etc.) the purchase flow still proceeds —
// losing an order log is better than blocking a real customer.
async function recordOrderAndOpen(
  itemType: "template" | "product" | "service",
  itemId: string,
  itemName: string,
  price: string | number | null | undefined,
  url: string,
) {
  try {
    await supabase.from("orders").insert({
      item_type: itemType,
      item_id: itemId,
      item_name: itemName,
      price: price != null ? String(price) : null,
    });
  } catch {
    // non-blocking
  }
  window.open(url, "_blank", "noopener");
}

// Menu in the store header (the ids match the sections below)
const SECTIONS = [
  { id: "store-templates", label: "Templates" },
  { id: "store-products", label: "Products" },
  { id: "store-resources", label: "Resources" },
  { id: "store-services", label: "Services" },
  { id: "store-contact", label: "Contact" },
] as const;

// One accent colour per template category
const CATEGORY_COLORS: Record<string, string> = {
  birthday: "#f0a830",
  proposal: "#e5606f",
  wedding: "#d8b979",
  sorry: "#6f9bf2",
};

type Props = { open: boolean; onClose: () => void };

export function StoreOverlay({ open, onClose }: Props) {
  const [category, setCategory] = useState<CategorySlug>("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);
  const [activeShot, setActiveShot] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const { data: TEMPLATES } = useTemplates();
  const { data: MY_PRODUCTS } = useMyProducts();
  const { data: RESOURCES } = useResources();
  const { data: SERVICES } = useServices();

  // Body scroll lock while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Escape closes modal first, then store
  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (preview) setPreview(null);
      else onClose();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, preview, onClose]);

  // Highlights the menu item of the section that is currently on screen
  useEffect(() => {
    const root = bodyRef.current;
    if (!open || !root) return;
    const update = () => {
      const line = root.getBoundingClientRect().top + 140;
      let current = "";
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActiveSection(current);
    };
    root.addEventListener("scroll", update, { passive: true });
    update();
    return () => root.removeEventListener("scroll", update);
  }, [open]);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [category, query, TEMPLATES]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: TEMPLATES.length };
    for (const t of TEMPLATES) map[t.category] = (map[t.category] ?? 0) + 1;
    return map;
  }, [TEMPLATES]);

  // The template shown big in the hero
  const featured = useMemo(
    () =>
      TEMPLATES.find((t) => t.badge === "bestseller") ??
      TEMPLATES.find((t) => t.badge === "premium") ??
      TEMPLATES[0],
    [TEMPLATES],
  );

  const openPreview = (t: Template) => {
    setPreview(t);
    setActiveShot(0);
    setShowVideo(false);
  };

  const stats = [
    { n: TEMPLATES.length, label: "Templates" },
    { n: MY_PRODUCTS.length, label: "Apps" },
    { n: RESOURCES.length, label: "Free resources" },
    { n: SERVICES.length, label: "Services" },
  ];

  return (
    <>
      <div className={`store-scrim${open ? " open" : ""}`} onClick={onClose} />
      <div
        className={`store-shell${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Digital Store"
        aria-hidden={!open}
      >
        <header className="st-header">
          <div className="st-logo">
            Store
            <small>by Abhyanshu</small>
          </div>
          <div className="st-tabs" role="group" aria-label="Store sections">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`st-tab${activeSection === s.id ? " active" : ""}`}
                onClick={() => goTo(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="st-search">
            <span aria-hidden="true">⌕</span>
            <input
              placeholder="Search templates…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) goTo("store-templates");
              }}
              aria-label="Search templates"
            />
          </div>
          <button className="store-close" aria-label="Close store" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="store-body" ref={bodyRef}>
          {/* HERO */}
          <section className="st-hero" id="store-hero">
            <div className="st-hero-copy">
              <div className="st-eyebrow">Digital marketplace</div>
              <h2 className="st-title">
                Premium
                <em>Templates</em>
              </h2>
              <p className="st-hero-desc">
                Handcrafted templates, apps and free resources for moments that matter. Pick what
                you like and buy directly on WhatsApp.
              </p>
              <div className="st-hero-cta">
                <button className="st-btn primary big" onClick={() => goTo("store-templates")}>
                  Browse templates ↓
                </button>
                <a
                  className="st-btn big"
                  href={STORE_CONTACT[0]?.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat on WhatsApp ↗
                </a>
              </div>
              <div className="st-stats">
                {stats.map((s) => (
                  <div className="st-stat" key={s.label}>
                    <b>{s.n}</b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {featured && (
              <div className="st-showcase">
                <span className="st-showcase-tag">★ Featured</span>
                <TemplateCard t={featured} index={0} onPreview={() => openPreview(featured)} />
              </div>
            )}
          </section>

          {/* TEMPLATES / CATEGORY FILTER */}
          <section className="st-section" id="store-templates">
            <div className="st-head">
              <div>
                <div className="section-label">Browse catalog</div>
                <h3 className="st-h2">
                  All <em>Templates</em>
                </h3>
              </div>
              <div className="st-count">
                {filtered.length} of {TEMPLATES.length} templates
              </div>
            </div>
            <div className="st-filter" role="tablist">
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  role="tab"
                  aria-selected={category === c.slug}
                  className={`st-pill${category === c.slug ? " active" : ""}`}
                  onClick={() => setCategory(c.slug)}
                >
                  {c.name}
                  <b>{counts[c.slug] ?? 0}</b>
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="st-empty">
                No templates match.
                <button
                  className="st-btn"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="st-grid">
                {filtered.map((t, i) => (
                  <TemplateCard key={t.id} t={t} index={i} onPreview={() => openPreview(t)} />
                ))}
              </div>
            )}
          </section>

          {/* MY PRODUCTS */}
          <section className="st-section" id="store-products">
            <div className="st-head">
              <div>
                <div className="section-label">Built by me</div>
                <h3 className="st-h2">
                  My <em>Products</em>
                </h3>
              </div>
            </div>
            <div className="st-wide-grid">
              {MY_PRODUCTS.map((p, i) => (
                <article
                  key={p.id}
                  className="st-card st-prod"
                  style={{ "--i": i } as CSSProperties}
                >
                  <div className="st-prod-mono" aria-hidden="true">
                    {p.monogram}
                  </div>
                  <div className="st-prod-main">
                    <div className="st-prod-top">
                      <span className={`st-status ${p.status === "live" ? "live" : "soon"}`}>
                        <i />
                        {p.status === "live" ? "Live" : "Coming soon"}
                      </span>
                      <span className="st-meta-text">{p.stack.join(" · ")}</span>
                    </div>
                    <h4 className="st-name">{p.name}</h4>
                    <p className="st-desc">{p.description}</p>
                    <div className="st-chips">
                      {p.features.slice(0, 3).map((f) => (
                        <span key={f} className="st-chip-sm">
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="st-actions">
                      {p.status === "live" && p.liveUrl && (
                        <a
                          className="st-btn primary"
                          href={p.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open live ↗
                        </a>
                      )}
                      <a
                        className="st-btn"
                        href={p.learnMoreUrl ?? "https://github.com/abhyanshu2"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn more
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FREE RESOURCES */}
          <section className="st-section" id="store-resources">
            <div className="st-head">
              <div>
                <div className="section-label">Free downloads</div>
                <h3 className="st-h2">
                  Free <em>Resources</em>
                </h3>
              </div>
            </div>
            <div className="st-res-grid">
              {RESOURCES.map((r, i) => (
                <article key={r.id} className="st-res" style={{ "--i": i } as CSSProperties}>
                  <div className="st-res-ico">{r.type}</div>
                  <div className="st-res-main">
                    <h4 className="st-res-name">{r.name}</h4>
                    <p className="st-res-desc">{r.description}</p>
                  </div>
                  <a
                    className="st-btn primary"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ↓
                  </a>
                </article>
              ))}
            </div>
          </section>

          {/* SERVICES */}
          <section className="st-section" id="store-services">
            <div className="st-head">
              <div>
                <div className="section-label">Hire me</div>
                <h3 className="st-h2">
                  My <em>Services</em>
                </h3>
              </div>
            </div>
            <div className="st-svc-grid">
              {SERVICES.map((s, i) => (
                <article
                  key={s.id}
                  className="st-card st-svc"
                  style={{ "--i": i } as CSSProperties}
                >
                  <div className="st-svc-price">{s.price}</div>
                  <h4 className="st-name">{s.name}</h4>
                  <p className="st-desc">{s.description}</p>
                  <ul className="st-checks">
                    {s.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    className="st-btn primary st-svc-btn"
                    onClick={() =>
                      recordOrderAndOpen("service", s.id, s.name, s.price, buildHireMeUrl(s.name))
                    }
                  >
                    Hire Me ↗
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* CONTACT */}
          <section className="st-section" id="store-contact">
            <div className="st-head">
              <div>
                <div className="section-label">Get in touch</div>
                <h3 className="st-h2">
                  Let's <em>Connect</em>
                </h3>
              </div>
            </div>
            <div className="st-contact-grid">
              {STORE_CONTACT.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="st-tile"
                >
                  <div>
                    <div className="st-meta-text">{c.label}</div>
                    <div className="st-tile-value">{c.value}</div>
                  </div>
                  <span className="st-tile-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </section>

          <footer className="st-footer">
            © {new Date().getFullYear()} Abhyanshu Raj · Digital Store · Powered by WhatsApp
          </footer>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <div className={`tpl-modal-scrim${preview ? " open" : ""}`} onClick={() => setPreview(null)}>
        {preview && (
          <div
            className="tpl-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={preview.name}
            style={
              { "--cc": CATEGORY_COLORS[preview.category] ?? "var(--accent)" } as CSSProperties
            }
          >
            <div className="tpl-modal-head">
              <div>
                <div className="tpl-cat">{preview.category.toUpperCase()}</div>
                <h4 className="tpl-name" style={{ fontSize: 24, marginBottom: 0 }}>
                  {preview.name}
                </h4>
              </div>
              <button
                className="store-close"
                aria-label="Close preview"
                onClick={() => setPreview(null)}
              >
                ✕
              </button>
            </div>
            <div className="tpl-modal-body">
              <div className="tpl-gallery">
                <div className="tpl-gallery-main">
                  {showVideo && preview.videoUrl ? (
                    <video
                      src={preview.videoUrl}
                      controls
                      autoPlay
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        background: "#000",
                      }}
                    />
                  ) : preview.images?.length ? (
                    <img
                      src={preview.images[Math.min(activeShot, preview.images.length - 1)]}
                      alt={`${preview.name} screenshot ${activeShot + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <span className="mono">
                      {preview.screenshots[activeShot] ?? preview.monogram}
                    </span>
                  )}
                </div>
                <div className="tpl-gallery-thumbs">
                  {(preview.images?.length ? preview.images : preview.screenshots).map((s, i) => (
                    <button
                      key={i}
                      className={`tpl-thumb${!showVideo && i === activeShot ? " active" : ""}`}
                      onClick={() => {
                        setActiveShot(i);
                        setShowVideo(false);
                      }}
                      aria-label={`Screenshot ${i + 1}`}
                      style={
                        preview.images?.length ? { padding: 0, overflow: "hidden" } : undefined
                      }
                    >
                      {preview.images?.length ? (
                        <img
                          src={s}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        s
                      )}
                    </button>
                  ))}
                  {preview.videoUrl && (
                    <button
                      className={`tpl-thumb${showVideo ? " active" : ""}`}
                      onClick={() => setShowVideo(true)}
                      aria-label="Demo video"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                      }}
                    >
                      ▶
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="tpl-modal-desc">{preview.description}</p>
                <ul className="st-checks" style={{ marginBottom: 24 }}>
                  {preview.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="tpl-modal-price">₹{preview.price}</div>
                <div className="st-actions" style={{ flexWrap: "wrap" }}>
                  <button
                    className="st-btn primary big"
                    onClick={() =>
                      recordOrderAndOpen(
                        "template",
                        preview.id,
                        preview.name,
                        preview.price,
                        buildWhatsAppUrl(preview.name),
                      )
                    }
                  >
                    Buy Now via WhatsApp ↗
                  </button>
                  {preview.demoUrl && (
                    <a
                      className="st-btn big"
                      href={preview.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live demo ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/** Cover of a template: the real image when there is one, otherwise a coloured tile with the monogram. */
function Cover({ t }: { t: Pick<Template, "cover" | "name" | "monogram"> }) {
  const [failed, setFailed] = useState(false);
  if (t.cover && !failed) {
    return (
      <img
        className="st-cover-img"
        src={t.cover}
        alt={`${t.name} preview`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="st-mono" aria-hidden="true">
      {t.monogram}
    </span>
  );
}

function TemplateCard({
  t,
  index,
  onPreview,
}: {
  t: Template;
  index: number;
  onPreview: () => void;
}) {
  const color = CATEGORY_COLORS[t.category] ?? "var(--accent)";
  return (
    <article className="st-card" style={{ "--cc": color, "--i": index } as CSSProperties}>
      <div className="st-cover">
        <Cover t={t} />
        {t.badge && <span className={`st-badge ${t.badge}`}>{t.badge}</span>}
        <button className="st-quick" onClick={onPreview}>
          Quick preview →
        </button>
      </div>
      <div className="st-body">
        <div className="st-meta">
          <span>{t.category.replace("-", " ")}</span>
          {t.demoUrl && <span className="st-demo">● Live demo</span>}
        </div>
        <h4 className="st-name">{t.name}</h4>
        <p className="st-desc">{t.description}</p>
        {t.features.length > 0 && (
          <div className="st-chips">
            {t.features.slice(0, 3).map((f) => (
              <span key={f} className="st-chip-sm">
                {f}
              </span>
            ))}
          </div>
        )}
        <div className="st-foot">
          <span className="st-price">₹{t.price}</span>
          <div className="st-actions">
            <button className="st-btn" onClick={onPreview}>
              Preview
            </button>
            <button
              className="st-btn primary"
              onClick={() =>
                recordOrderAndOpen("template", t.id, t.name, t.price, buildWhatsAppUrl(t.name))
              }
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}