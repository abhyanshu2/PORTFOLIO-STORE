import { useEffect, useMemo, useState } from "react";
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
  url: string
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

type Props = { open: boolean; onClose: () => void };

export function StoreOverlay({ open, onClose }: Props) {
  const [category, setCategory] = useState<CategorySlug>("all");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);
  const [activeShot, setActiveShot] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const { data: TEMPLATES } = useTemplates();
  const { data: MY_PRODUCTS } = useMyProducts();
  const { data: RESOURCES } = useResources();
  const { data: SERVICES } = useServices();

  // Body scroll lock while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
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


  return (
    <>
      <div className={`store-scrim${open ? " open" : ""}`} onClick={onClose} />
      <div className={`store-shell${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Digital Store" aria-hidden={!open}>
        <header className="store-header">
          <div className="store-logo">Store<span></span></div>
          <div className="store-search">
            <span>⌕</span>
            <input
              placeholder="SEARCH TEMPLATES…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search templates"
            />
          </div>
          <button className="store-close" aria-label="Close store" onClick={onClose}>✕</button>
        </header>

        <div className="store-body">
          {/* HERO */}
          <section className="store-hero" id="store-hero">
            <div className="store-hero-label">DIGITAL MARKETPLACE</div>
            <h2 className="store-hero-title">Premium<br /><span className="dim">Templates</span></h2>
            <p className="store-hero-desc">Curated collection of premium templates, apps, and free resources. Handcrafted for creators, businesses, and moments that matter — buy directly via WhatsApp.</p>
            <div className="store-hero-badges">
              <span className="store-hero-badge"><span className="dot" />✦ FEATURED</span>
              <span className="store-hero-badge"><span className="dot" />NEW COLLECTION</span>
              <span className="store-hero-badge"><span className="dot" />TRENDING NOW</span>
              <span className="store-hero-badge"><span className="dot" />PREMIUM</span>
            </div>
          </section>


          {/* TEMPLATES / CATEGORY FILTER */}
          <section className="store-section" id="store-templates">
            <div className="store-section-header">
              <div className="section-label">Browse Catalog</div>
              <h3 className="store-section-title">All <em>Templates</em></h3>
            </div>
            <div className="category-filter" role="tablist">
              {CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  role="tab"
                  aria-selected={category === c.slug}
                  className={`cat-chip${category === c.slug ? " active" : ""}`}
                  onClick={() => setCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 0", color: "var(--muted)", textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: ".1em" }}>
                NO TEMPLATES MATCH  TRY ANOTHER CATEGORY OR SEARCH
              </div>
            ) : (
              <div className="tpl-grid">
                {filtered.map((t) => (
                  <TemplateCard key={t.id} t={t} onPreview={() => { setPreview(t); setActiveShot(0); setShowVideo(false); }} />
                ))}
              </div>
            )}
          </section>

          {/* MY PRODUCTS */}
          <section className="store-section" id="store-products">
            <div className="store-section-header">
              <div className="section-label">Built by me</div>
              <h3 className="store-section-title">My <em>Products</em></h3>
            </div>
            <div className="tpl-grid">
              {MY_PRODUCTS.map((p) => (
                <article key={p.id} className="tpl-card">
                  <div className="tpl-cover">
                    <span className="mono">{p.monogram}</span>
                    {p.status === "coming-soon" && <span className="tpl-badge new" style={{ background: "var(--surface2)", color: "var(--muted)" }}>SOON</span>}
                    {p.status === "live" && <span className="tpl-badge">LIVE</span>}
                  </div>
                  <div className="tpl-info">
                    <div className="tpl-cat">{p.stack.join(" · ")}</div>
                    <h4 className="tpl-name">{p.name}</h4>
                    <p className="tpl-desc">{p.description}</p>
                    <div className="tpl-foot">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {p.features.slice(0, 2).map((f) => <span key={f} className="tag" style={{ fontSize: 8, padding: "2px 6px" }}>{f}</span>)}
                      </div>
                      <div className="tpl-actions">
                        {p.status === "live" && p.liveUrl && (
                          <a className="tpl-btn primary" href={p.liveUrl} target="_blank" rel="noopener">Live ↗</a>
                        )}
                        <a className="tpl-btn" href={p.learnMoreUrl ?? "https://github.com/abhyanshu2"} target="_blank" rel="noopener">Learn</a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FREE RESOURCES */}
          <section className="store-section" id="store-resources">
            <div className="store-section-header">
              <div className="section-label">Free downloads</div>
              <h3 className="store-section-title">Free <em>Resources</em></h3>
            </div>
            <div className="tpl-grid">
              {RESOURCES.map((r) => (
                <article key={r.id} className="tpl-card">
                  <div className="tpl-info" style={{ padding: 24 }}>
                    <div className="tpl-cat">{r.type} · FREE</div>
                    <h4 className="tpl-name">{r.name}</h4>
                    <p className="tpl-desc">{r.description}</p>
                    <div className="tpl-foot">
                      <span className="tpl-price">FREE</span>
                      <a className="tpl-btn primary" href={r.url} target="_blank" rel="noopener">Download ↓</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* SERVICES */}
          <section className="store-section" id="store-services">
            <div className="store-section-header">
              <div className="section-label">Hire me</div>
              <h3 className="store-section-title">My <em>Services</em></h3>
            </div>
            <div className="tpl-grid">
              {SERVICES.map((s) => (
                <article key={s.id} className="tpl-card">
                  <div className="tpl-info" style={{ padding: 26 }}>
                    <div className="tpl-cat">{s.price}</div>
                    <h4 className="tpl-name">{s.name}</h4>
                    <p className="tpl-desc">{s.description}</p>
                    <ul className="tpl-feature-list" style={{ marginBottom: 16 }}>
                      {s.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                    <div className="tpl-foot">
                      <span></span>
                      <button
                        className="tpl-btn primary"
                        onClick={() => recordOrderAndOpen("service", s.id, s.name, s.price, buildHireMeUrl(s.name))}
                      >
                        Hire Me ↗
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* CONTACT */}
          <section className="store-section" id="store-contact">
            <div className="store-section-header">
              <div className="section-label">Get in touch</div>
              <h3 className="store-section-title">Let's <em>Connect</em></h3>
            </div>
            <div className="tpl-grid" style={{ maxWidth: 720 }}>
              {STORE_CONTACT.map((c) => (
                <a key={c.label} href={c.href} target="_blank" rel="noopener" className="tpl-card" style={{ textDecoration: "none" }}>
                  <div className="tpl-info" style={{ padding: 24 }}>
                    <div className="tpl-cat">{c.label}</div>
                    <h4 className="tpl-name" style={{ fontSize: 18 }}>{c.value}</h4>
                    <div className="tpl-foot">
                      <span></span>
                      <span className="tpl-btn primary">Open ↗</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <footer style={{ padding: "28px 52px", borderTop: "1px solid var(--border)", textAlign: "center", background: "var(--bg2)" }}>
            <div className="footer-left" style={{ display: "block" }}>
              © {new Date().getFullYear()} ABHYANSHU RAJ · DIGITAL STORE · POWERED BY WHATSAPP
            </div>
          </footer>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <div className={`tpl-modal-scrim${preview ? " open" : ""}`} onClick={() => setPreview(null)}>
        {preview && (
          <div className="tpl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={preview.name}>
            <div className="tpl-modal-head">
              <div>
                <div className="tpl-cat">{preview.category.toUpperCase()}</div>
                <h4 className="tpl-name" style={{ fontSize: 24, marginBottom: 0 }}>{preview.name}</h4>
              </div>
              <button className="store-close" aria-label="Close preview" onClick={() => setPreview(null)}>✕</button>
            </div>
            <div className="tpl-modal-body">
              <div className="tpl-gallery">
                <div className="tpl-gallery-main">
                  {showVideo && preview.videoUrl ? (
                    <video
                      src={preview.videoUrl}
                      controls
                      autoPlay
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#000" }}
                    />
                  ) : preview.images?.length ? (
                    <img
                      src={preview.images[Math.min(activeShot, preview.images.length - 1)]}
                      alt={`${preview.name} screenshot ${activeShot + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <span className="mono">{preview.screenshots[activeShot] ?? preview.monogram}</span>
                  )}
                </div>
                <div className="tpl-gallery-thumbs">
                  {(preview.images?.length ? preview.images : preview.screenshots).map((s, i) => (
                    <button
                      key={i}
                      className={`tpl-thumb${!showVideo && i === activeShot ? " active" : ""}`}
                      onClick={() => { setActiveShot(i); setShowVideo(false); }}
                      aria-label={`Screenshot ${i + 1}`}
                      style={preview.images?.length ? { padding: 0, overflow: "hidden" } : undefined}
                    >
                      {preview.images?.length ? (
                        <img src={s} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
                    >
                      ▶
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="tpl-modal-desc">{preview.description}</p>
                <ul className="tpl-feature-list">
                  {preview.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div className="tpl-modal-price">₹{preview.price}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    className="tpl-btn primary"
                    style={{ padding: "12px 22px", fontSize: 11 }}
                    onClick={() =>
                      recordOrderAndOpen("template", preview.id, preview.name, preview.price, buildWhatsAppUrl(preview.name))
                    }
                  >
                    Buy Now via WhatsApp ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TemplateCard({ t, onPreview }: { t: Template; onPreview: () => void }) {
  return (
    <article className="tpl-card">
      <div className="tpl-cover">
        <div className="proj-corner proj-corner-tl"></div>
        <div className="proj-corner proj-corner-br"></div>
        {t.cover ? (
          <img src={t.cover} alt={`${t.name} preview`} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="mono">{t.monogram}</span>
        )}
        {t.badge && <span className={`tpl-badge ${t.badge}`}>{t.badge}</span>}
      </div>
      <div className="tpl-info">
        <div className="tpl-cat">{t.category.replace("-", " ")}</div>
        <h4 className="tpl-name">{t.name}</h4>
        <p className="tpl-desc">{t.description}</p>
        <div className="tpl-foot">
          <span className="tpl-price">₹{t.price}</span>
          <div className="tpl-actions">
            <button className="tpl-btn" onClick={onPreview}>Preview</button>
            <button
              className="tpl-btn primary"
              onClick={() => recordOrderAndOpen("template", t.id, t.name, t.price, buildWhatsAppUrl(t.name))}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}