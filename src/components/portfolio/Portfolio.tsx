import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ContactSection } from "./ContactSection";
import { ExperienceSection } from "./ExperienceSection";
import { PixelWipe, type PixelWipeHandle } from "./PixelWipe";
import DriftWall from "./DriftWall";
import TechText from "./TechText";
import { driftWallProps, useDriftWall } from "@/lib/drift-wall";
import { useProjects } from "@/lib/use-store-data";
import { rich, useSiteContent } from "@/lib/site-content";


type Props = { onOpenStore: () => void };

const NAME_WEIGHT = 900;
const NAME_SIZE = 400;
const NAME_SPACING = -0.025;

/**
 * Where one letter of the name starts (px from the left edge of the name box).
 * Uses the same layout rules as TechText, so it lands exactly on the drawn letter.
 */
function letterLeft(
  nameText: string,
  boxW: number,
  boxH: number,
  index: number,
  family: string,
): number | null {
  const NAME_TEXT = nameText;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe || index < 0) return null;
  const setFont = (size: number) => {
    probe.font = `${NAME_WEIGHT} ${size}px ${family}`;
    if ("letterSpacing" in probe) {
      (probe as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        `${NAME_SPACING * size}px`;
    }
    probe.textAlign = "left";
    probe.textBaseline = "alphabetic";
  };
  setFont(NAME_SIZE);
  const first = probe.measureText(NAME_TEXT);
  const inkW = first.actualBoundingBoxLeft + first.actualBoundingBoxRight;
  const inkH = first.actualBoundingBoxAscent + first.actualBoundingBoxDescent;
  const fit = Math.min(1, (boxW * 0.9) / Math.max(inkW, 1), (boxH * 0.66) / Math.max(inkH, 1));
  const size = NAME_SIZE * fit;
  setFont(size);
  const word = probe.measureText(NAME_TEXT);
  const x = boxW * 0.05 + word.actualBoundingBoxLeft;
  const own = probe.measureText(NAME_TEXT[index]);
  const upToLetter = probe.measureText(NAME_TEXT.slice(0, index + 1));
  return x + upToLetter.width - own.width - own.actualBoundingBoxLeft;
}

export function Portfolio({ onOpenStore }: Props) {
  const site = useSiteContent();
  const NAME_TEXT = site.hero.firstName || " ";
  const WALL_START_LETTER = NAME_TEXT.toUpperCase().indexOf((site.hero.wallLetter || "S").toUpperCase());
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { data: projects } = useProjects();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wiping, setWiping] = useState(false);
  const roleRef = useRef<HTMLDivElement | null>(null);
  const wipeRef = useRef<PixelWipeHandle | null>(null);
  const drift = useDriftWall();
  const heroRef = useRef<HTMLElement | null>(null);

  
  useEffect(() => {
    const hero = heroRef.current;
    const title = hero?.querySelector(".hero-title");
    const tech = hero?.querySelector(".hero-tech");
    const nav = document.querySelector("nav");
    if (!hero || !title) return;
    const update = () => {
      const heroBox = hero.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();
      const techBox = tech?.getBoundingClientRect();
      const sLeft =
        tech && techBox
          ? letterLeft(
              NAME_TEXT,
              techBox.width,
              techBox.height,
              WALL_START_LETTER,
              getComputedStyle(tech).fontFamily,
            )
          : null;
      const wallStart = techBox && sLeft !== null ? techBox.left + sLeft : titleBox.right;
      hero.style.setProperty("--drift-left", `${Math.round(wallStart - heroBox.left)}px`);
      hero.style.setProperty("--drift-top", `${nav ? nav.offsetHeight : 88}px`);
    };
    update();
    // measure again once the name font has finished loading
    const family = tech ? getComputedStyle(tech).fontFamily : "";
    document.fonts?.load(`${NAME_WEIGHT} 64px ${family}`, NAME_TEXT).then(update, update);
    const observer = new ResizeObserver(update);
    observer.observe(title);
    if (tech) observer.observe(tech);
    observer.observe(hero);
    if (nav) observer.observe(nav);
    return () => observer.disconnect();
  }, [NAME_TEXT, WALL_START_LETTER]);

  // Sync theme onto <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Nav scrolled state
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 50);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Escape closes mobile menu
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  // Body scroll lock for mobile menu
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Fade-up intersection observer
  useEffect(() => {
    const els = document.querySelectorAll(".fade-up");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [site]);

  // Typing animation for role
  const rolesList = site.hero.roles.filter((r) => r.trim());
  const rolesKey = rolesList.join("|");
  useEffect(() => {
    const el = roleRef.current;
    if (!el) return;
    const roles = rolesList.length ? rolesList : [""];
    let cancelled = false;
    let idx = 0;
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    el.appendChild(cursor);

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const type = async (text: string) => {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        el.textContent = text.substring(0, i);
        el.appendChild(cursor);
        await wait(80);
      }
    };
    const erase = async () => {
      const text = el.textContent ?? "";
      for (let i = text.length; i >= 0; i--) {
        if (cancelled) return;
        el.textContent = text.substring(0, i);
        el.appendChild(cursor);
        await wait(60);
      }
    };
    (async () => {
      await wait(800);
      while (!cancelled) {
        await type(roles[idx]);
        await wait(6000);
        if (cancelled) return;
        await erase();
        idx = (idx + 1) % roles.length;
      }
    })();
    return () => { cancelled = true; };
  }, [rolesKey]);

  const toggleTheme = async () => {
    if (wiping) return;
    setWiping(true);
    const nextDark = theme === "light";
    await wipeRef.current?.run({
      color: nextDark ? "#0a0a0a" : "#faf8f5",
      onCover: () => setTheme(nextDark ? "dark" : "light"),
    });
    setWiping(false);
  };

  // Store keeps the original left-to-right sweep
  const openStore = () => {
    if (wiping) return;
    setWiping(true);
    const wipe = document.getElementById("theme-wipe");
    if (wipe) {
      wipe.style.background = theme === "dark" ? "#0a0a0a" : "#faf8f5";
      wipe.classList.add("wiping");
    }
    // Store should appear instantly while the sweep covers the screen
    document.documentElement.classList.add("store-wiping");
    setTimeout(() => onOpenStore(), 275);
    setTimeout(() => {
      if (wipe) {
        wipe.classList.remove("wiping");
        wipe.style.background = "";
      }
      setWiping(false);
    }, 580);
    setTimeout(() => document.documentElement.classList.remove("store-wiping"), 650);
  };

  return (
    <>
      <div id="theme-wipe"></div>
      <PixelWipe ref={wipeRef} />

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <button className="mobile-close" aria-label="Close" onClick={() => setMenuOpen(false)}>✕</button>
        {["about", "skills", "projects", "experience", "education", "contact"].map((s) => (
          <a key={s} href={`#${s}`} onClick={() => setMenuOpen(false)}>{s.charAt(0).toUpperCase() + s.slice(1)}</a>
        ))}
        <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); openStore(); }}>Store</a>
      </div>

      {/* NAV */}
      <nav id="nav" className={scrolled ? "scrolled" : ""}>
        <a href="#" className="nav-logo">{site.nav.logo}</a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#education">Education</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="nav-right">
          <button className="theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>
            <span className="tog-icon">{theme === "dark" ? "🌙" : "☀️"}</span>
            <div className="tog-track"><div className="tog-thumb"></div></div>
            <span className="tog-label">{theme === "dark" ? "LIGHT" : "DARK"}</span>
          </button>
          <a href="#" className="nav-resume" onClick={(e) => { e.preventDefault(); openStore(); }}>{site.nav.storeButton}</a>
          <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)} style={menuOpen ? { transform: "none" } : undefined}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero" ref={heroRef}>
        <div className="hero-blob"></div>
        <div className="hero-grid"></div>
        <div className="hero-vline"></div>
        {drift.ready && drift.settings.enabled && (
          <div className="hero-drift" aria-hidden="true">
            <DriftWall
              items={drift.items}
              {...driftWallProps(drift.settings)}
              maskMode="open-top"
            />
          </div>
        )}
        <div className="hero-badge">
          <Link to="/admin/login" aria-label="Admin" className="badge-dot" style={{ cursor: "pointer" }}></Link>
          {site.hero.badge}
        </div>
        <div className="hero-number">{site.hero.number}</div>
        <h1 className="hero-title">
          <span className="hero-tech">
            <TechText
              text={NAME_TEXT}
              fontWeight={NAME_WEIGHT}
              fontSize={NAME_SIZE}
              letterSpacing={NAME_SPACING}
              align="left"
              reveal="letter"
              dashLength={4}
              dashGap={2}
              specks={15}
              intro="none"
              introDuration={2}
              clickKick
              guides={false}
              color="currentColor"
              accentColor={theme === "dark" ? "#d4870a" : "#9a5600"}
              reach={200}
              softness={0.7}
              lineStyle="dashed"
              strokeWidth={1.5}
              speed={1}
              bounce={0.4}
              selection
              labels
              draggable
              sweep={false}
            />
          </span>
          <span className="dim">{site.hero.lastName}</span>
        </h1>
        <div className="hero-subtitle-row">
          <div className="hero-role" ref={roleRef}></div>
          <div>
            <p className="hero-desc">{rich(site.hero.description)}</p>
            <div className="hero-ctas">
              <a href="#projects" className="btn-primary">{site.hero.primaryButton}</a>
              <button type="button" className="btn-ghost" onClick={openStore} style={{ font: "inherit" }}>{site.hero.storeButton}</button>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, i) => (
            site.marquee.map((t, n) => (
              <span key={`${i}-${n}`} className="marquee-item">{t} <span className="marquee-dot"></span></span>
            ))
          ))}
        </div>
      </div>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="about-left fade-up">
          <div className="section-label">{site.about.label}</div>
          <div className="big-text">{site.about.titleTop}<br />{site.about.titleBottom} <em>{site.about.titleEm}</em></div>
          <div className="stats-row">
            {site.about.stats.map((st, i) => (
              <div key={i} className="stat"><span className="stat-num">{st.num}</span><span className="stat-label">{st.label}</span></div>
            ))}
          </div>
        </div>
        <div className="about-right fade-up">
          {site.about.paragraphs.map((t, i) => (
            <p key={i} className="about-para">{rich(t)}</p>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section className="skills" id="skills">
        <div className="skills-header fade-up">
          <div>
            <div className="section-label">{site.skills.label}</div>
            <h2 className="skills-title">{site.skills.titleTop}<br />{site.skills.titleBottom}</h2>
          </div>
          <p className="skills-desc">{site.skills.description}</p>
        </div>
        <div className="skills-grid fade-up">
          {site.skills.groups.map((g, gi) => (
            <div key={gi} className="skill-card">
              <div className="skill-card-label">{g.label}</div>
              <div className="skill-tags">{g.tags.map((t, ti) => <span key={ti} className="tag">{t}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section className="projects" id="projects">
        <div className="projects-header fade-up">
          <div className="section-label">{site.projects.label}</div>
          <h2 className="projects-title">{site.projects.titleTop}<br /><em style={{ fontStyle: "italic", color: "var(--muted)" }}>{site.projects.titleEm}</em></h2>
        </div>
        <div className="project-featured fade-up">
          <div className="project-featured-visual">
            <div className="proj-corner proj-corner-tl"></div>
            <div className="proj-corner proj-corner-br"></div>
            <span className="proj-monogram">{projects.find((p) => p.featured)?.monogram ?? "★"}</span>
          </div>
          <div className="project-featured-info">
            <div>
              <div className="project-badge">FEATURED PROJECT</div>
              <h3 className="project-name">{projects.find((p) => p.featured)?.name}</h3>
              <p className="project-desc">{projects.find((p) => p.featured)?.description}</p>
            </div>
            <div>
              <div className="project-tech">
                {(projects.find((p) => p.featured)?.tech ?? []).map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
              <div className="project-links">
                {projects.find((p) => p.featured)?.githubUrl && (
                  <a href={projects.find((p) => p.featured)!.githubUrl} target="_blank" rel="noopener" className="proj-link primary">GitHub ↗</a>
                )}
                {projects.find((p) => p.featured)?.liveUrl && (
                  <a href={projects.find((p) => p.featured)!.liveUrl} target="_blank" rel="noopener" className="proj-link">Live Preview ↗</a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="projects-list fade-up">
          {projects
            .filter((p) => !p.featured)
            .map((p) => (
              <div key={p.id} className="project-item">
                <div className="project-item-year">{p.year}</div>
                <h3 className="project-item-name">{p.name}</h3>
                <p className="project-item-desc">{p.description}</p>
                <div className="project-tech" style={{ marginBottom: 18 }}>{p.tech.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {p.githubUrl && (
                    <a href={p.githubUrl} target="_blank" rel="noopener" className="project-item-link">View on GitHub</a>
                  )}
                  {p.liveUrl && (
                    <a href={p.liveUrl} target="_blank" rel="noopener" className="project-item-link">Live Preview</a>
                  )}
                </div>
              </div>
            ))}
        </div>
        <div style={{ marginTop: 36, textAlign: "center", paddingTop: 36, borderTop: "1px solid var(--border)" }}>
          <a href={site.projects.githubUrl} target="_blank" rel="noopener" className="btn-ghost">{site.projects.allButton}</a>
        </div>
      </section>

      {/* EXPERIENCE */}
      <ExperienceSection />

      {/* EDUCATION */}
      <section className="education" id="education">
        <div className="fade-up">
          <div className="section-label">{site.education.label}</div>
          <h2 className="education-title">{site.education.titleTop}<br /><em style={{ fontStyle: "italic", color: "var(--muted)" }}>{site.education.titleEm}</em></h2>
        </div>
        <div className="edu-list fade-up">
          {site.education.items.map((e, i) => (
            <div key={i} className="edu-item">
              <span className="edu-year">{e.year}</span>
              <span className="edu-degree">{e.degree}{e.note && (<><br /><small style={{ color: "var(--muted2)", fontSize: 12, fontWeight: 400 }}>{e.note}</small></>)}</span>
              <span className="edu-school">{e.school}</span>
              <span className="edu-score">{e.score}</span>
            </div>
          ))}
        </div>
      </section>

      <ContactSection />
    </>
  );
}