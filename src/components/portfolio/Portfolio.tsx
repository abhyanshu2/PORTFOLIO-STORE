import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ContactForm } from "./ContactForm";
import { useProjects } from "@/lib/use-store-data";


type Props = { onOpenStore: () => void };

export function Portfolio({ onOpenStore }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { data: projects } = useProjects();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [wiping, setWiping] = useState(false);
  const roleRef = useRef<HTMLDivElement | null>(null);

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
  }, []);

  // Typing animation for role
  useEffect(() => {
    const el = roleRef.current;
    if (!el) return;
    const roles = ["Frontend Developer", "Backend Developer", "Web Developer", "Full Stack Developer"];
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
  }, []);

  const toggleTheme = () => {
    if (wiping) return;
    setWiping(true);
    const wipe = document.getElementById("theme-wipe");
    const nextDark = theme === "light";
    if (wipe) {
      wipe.style.background = nextDark ? "#0a0a0a" : "#faf8f5";
      wipe.classList.add("wiping");
    }
    setTimeout(() => setTheme(nextDark ? "dark" : "light"), 275);
    setTimeout(() => {
      if (wipe) {
        wipe.classList.remove("wiping");
        wipe.style.background = "";
      }
      setWiping(false);
    }, 580);
  };

  return (
    <>
      <div id="theme-wipe"></div>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <button className="mobile-close" aria-label="Close" onClick={() => setMenuOpen(false)}>✕</button>
        {["about", "skills", "projects", "education", "contact"].map((s) => (
          <a key={s} href={`#${s}`} onClick={() => setMenuOpen(false)}>{s.charAt(0).toUpperCase() + s.slice(1)}</a>
        ))}
        <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onOpenStore(); }}>Store</a>
      </div>

      {/* NAV */}
      <nav id="nav" className={scrolled ? "scrolled" : ""}>
        <a href="#" className="nav-logo">Abhyanshu<span>.</span></a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#skills">Skills</a></li>
          <li><a href="#projects">Projects</a></li>
          <li><a href="#education">Education</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="nav-right">
          <button className="theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>
            <span className="tog-icon">{theme === "dark" ? "🌙" : "☀️"}</span>
            <div className="tog-track"><div className="tog-thumb"></div></div>
            <span className="tog-label">{theme === "dark" ? "LIGHT" : "DARK"}</span>
          </button>
          <a href="#" className="nav-resume" onClick={(e) => { e.preventDefault(); onOpenStore(); }}>Visit Store ↗</a>
          <button className="hamburger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)} style={menuOpen ? { transform: "none" } : undefined}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-blob"></div>
        <div className="hero-grid"></div>
        <div className="hero-vline"></div>
        <div className="hero-badge">
          <Link to="/admin/login" aria-label="Admin" className="badge-dot" style={{ cursor: "pointer" }}></Link>
          OPEN TO OPPORTUNITIES
        </div>
        <div className="hero-number">01 — INTRODUCTION</div>
        <h1 className="hero-title">ABHYANSHU<br /><span className="dim">Raj</span></h1>
        <div className="hero-subtitle-row">
          <div className="hero-role" ref={roleRef}></div>
          <div>
            <p className="hero-desc"><strong>Building pixel-perfect interfaces</strong> with modern web technologies. Passionate about React, Next.js &amp; creating experiences that feel intentional. Based in <strong>Vaishali, Bihar</strong>.</p>
            <div className="hero-ctas">
              <a href="#projects" className="btn-primary">View My Work</a>
              <button type="button" className="btn-ghost" onClick={onOpenStore} style={{ font: "inherit" }}>Visit Store ↗</button>
            </div>
          </div>
        </div>

        <div className="scroll-indicator"><div className="scroll-line"></div>SCROLL</div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, i) => (
            ["React", "Next.js 15", "TypeScript", "Node.js", "Tailwind CSS", "MongoDB", "Framer Motion", "Git / GitHub"].map((t) => (
              <span key={`${i}-${t}`} className="marquee-item">{t} <span className="marquee-dot"></span></span>
            ))
          ))}
        </div>
      </div>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="about-left fade-up">
          <div className="section-label">01 — about</div>
          <div className="big-text">WHO<br />I <em>AM.</em></div>
          <div className="stats-row">
            <div className="stat"><span className="stat-num">2+</span><span className="stat-label">Years Learning</span></div>
            <div className="stat"><span className="stat-num">4+</span><span className="stat-label">Projects Built</span></div>
            <div className="stat"><span className="stat-num">10+</span><span className="stat-label">Tech Stack</span></div>
            <div className="stat"><span className="stat-num">∞</span><span className="stat-label">Curiosity</span></div>
          </div>
        </div>
        <div className="about-right fade-up">
          <p className="about-para">I'm a <strong>Diploma student in Computer Science & Engineering</strong> currently in my 4th semester. What started with HTML and CSS turned into a full-stack rabbit hole — React, Next.js, Node.js, MongoDB, and shipping real interfaces that feel intentional.</p>
          <p className="about-para">Passionate about <strong>clean UI, modern design systems</strong>, and building things that actually work. Exploring Framer Motion, TypeScript, and scalable backend architectures.</p>
          <p className="about-para">When I'm not coding, I'm <strong>watching tech YouTube</strong>, exploring new gadgets, or travelling. Based in <strong>Vaishali, Bihar</strong> — available for remote &amp; freelance opportunities.</p>
        </div>
      </section>

      {/* SKILLS */}
      <section className="skills" id="skills">
        <div className="skills-header fade-up">
          <div>
            <div className="section-label">02 — skills</div>
            <h2 className="skills-title">MY<br />TOOLKIT</h2>
          </div>
          <p className="skills-desc">Things I build with daily, growing in, and rely on to design, ship, and iterate.</p>
        </div>
        <div className="skills-grid fade-up">
          {[
            ["Frontend", ["Next.js 15", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "HTML5", "CSS3 / SCSS", "JavaScript ES6+"]],
            ["Backend", ["Node.js", "Express.js", "MongoDB", "Mongoose", "REST API", "JWT Auth"]],
            ["Tools & Deployment", ["Git / GitHub", "VS Code", "Vercel", "Netlify", "Render", "Postman", "Turborepo", "npm Workspaces"]],
            ["Languages", ["Hindi", "English"]],
          ].map(([label, tags]) => (
            <div key={label as string} className="skill-card">
              <div className="skill-card-label">{label}</div>
              <div className="skill-tags">{(tags as string[]).map((t) => <span key={t} className="tag">{t}</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section className="projects" id="projects">
        <div className="projects-header fade-up">
          <div className="section-label">03 — projects</div>
          <h2 className="projects-title">SELECTED<br /><em style={{ fontStyle: "italic", color: "var(--muted)" }}>Work</em></h2>
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
          <a href="https://github.com/abhyanshu2" target="_blank" rel="noopener" className="btn-ghost">View All on GitHub ↗</a>
        </div>
      </section>

      {/* EDUCATION */}
      <section className="education" id="education">
        <div className="fade-up">
          <div className="section-label">04 — education</div>
          <h2 className="education-title">LEARNING<br /><em style={{ fontStyle: "italic", color: "var(--muted)" }}>Path</em></h2>
        </div>
        <div className="edu-list fade-up">
          <div className="edu-item">
            <span className="edu-year">2023 — NOW</span>
            <span className="edu-degree">Diploma — Computer Science &amp; Engg<br /><small style={{ color: "var(--muted2)", fontSize: 12, fontWeight: 400 }}>Currently in 4th Semester</small></span>
            <span className="edu-school">Pursuing Diploma</span>
            <span className="edu-score">In Progress</span>
          </div>
          <div className="edu-item">
            <span className="edu-year">2023</span>
            <span className="edu-degree">12th — Science (BSEB)</span>
            <span className="edu-school">Akshyawat College Mahua, Vaishali</span>
            <span className="edu-score">60%</span>
          </div>
          <div className="edu-item">
            <span className="edu-year">2021</span>
            <span className="edu-degree">10th — CBSE</span>
            <span className="edu-school">Delhi Public School International, Muzaffarpur</span>
            <span className="edu-score">80%</span>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact" id="contact">
        <div className="fade-up">
          <div className="section-label" style={{ display: "inline-block" }}>05 — contact</div>
          <h2 className="contact-big">LET'S<br /><span className="dim">Build.</span></h2>
          <p className="contact-sub">Open to frontend roles, full-stack internships, freelance projects, and thoughtful collaborations. Let's create something great together.</p>
          <div className="contact-cta">
            <a href="mailto:abhyanshu2@gmail.com" className="btn-primary">Send Email ↗</a>
            <a href="https://github.com/abhyanshu2" target="_blank" rel="noopener" className="btn-ghost">GitHub ↗</a>
          </div>
        </div>
        <div className="contact-grid fade-up">
          <div className="contact-item"><div className="contact-item-label">Email</div><a href="mailto:abhyanshu2@gmail.com" className="contact-item-val">abhyanshu2@gmail.com</a></div>
          <div className="contact-item"><div className="contact-item-label">Phone / WhatsApp</div><a href="tel:+916206358342" className="contact-item-val">+91 6206358342</a></div>
          <div className="contact-item"><div className="contact-item-label">Instagram</div><a href="https://instagram.com/_abhyanshu" target="_blank" rel="noopener" className="contact-item-val">@_abhyanshu</a></div>
          <div className="contact-item"><div className="contact-item-label">GitHub</div><a href="https://github.com/abhyanshu2" target="_blank" rel="noopener" className="contact-item-val">github.com/abhyanshu2</a></div>
        </div>
        <div className="fade-up" style={{ marginTop: 40 }}>
          <ContactForm />
        </div>
      </section>

      <footer>
        <div className="footer-left">© {new Date().getFullYear()} ABHYANSHU RAJ — ALL RIGHTS RESERVED</div>
        <div className="footer-right">DESIGNED WITH PRECISION <span className="footer-heart">✦</span> BUILT WITH PASSION</div>
      </footer>
    </>
  );
}