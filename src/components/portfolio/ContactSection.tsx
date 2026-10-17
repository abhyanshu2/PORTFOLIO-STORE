import { useEffect, useState, type CSSProperties } from "react";
import { ContactForm } from "./ContactForm";
import { WHATSAPP_NUMBER } from "@/data/store/contact";

const EMAIL = "abhyanshu2@gmail.com";
const LINKEDIN_URL = "https://linkedin.com/in/abhyanshu";
// Put your resume PDF in the "public" folder with this name
const RESUME_URL = "/resume.pdf";
const CITY = "Vaishali, India";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/abhyanshu2" },
  { label: "LinkedIn", href: LINKEDIN_URL },
  { label: "Instagram", href: "https://instagram.com/_abhyanshu" },
  { label: "WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}` },
];

function useLocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
          .format(new Date())
          .toUpperCase(),
      );
    update();
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function ContactSection() {
  const [copied, setCopied] = useState(false);
  const time = useLocalTime();

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  return (
    <section
      id="contact"
      style={{
        padding: "110px clamp(20px, 4vw, 52px) 0",
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div className="fade-up" style={{ marginBottom: 40 }}>
        <div className="section-label">06 Contact</div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: "clamp(40px, 6vw, 76px)",
            lineHeight: 0.95,
            letterSpacing: "-.02em",
            color: "var(--heading)",
            marginBottom: 16,
          }}
        >
          Let's Work Together
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            maxWidth: 520,
            lineHeight: 1.85,
            fontWeight: 400,
          }}
        >
          Open to full-stack internships, frontend roles, freelance UI/UX work and collaborations.
        </p>
      </div>

      <div
        className="fade-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 16,
          alignItems: "start",
        }}
      >
        <ContactForm />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={label}>Email</div>
              <a href={`mailto:${EMAIL}`} style={{ ...value, textDecoration: "none" }}>
                {EMAIL}
              </a>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              className="btn-ghost"
              style={{ padding: "8px 16px" }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <div style={card}>
            <div style={label}>Socials</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 22px", marginTop: 4 }}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-item-val"
                  style={{ fontSize: 13 }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div
            style={{
              ...card,
              borderColor: "var(--tag-border)",
              background: "color-mix(in oklab, var(--accent) 7%, var(--surface))",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span className="badge-dot" />
              <span style={{ ...label, color: "#6ab04c", margin: 0 }}>Available</span>
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 21,
                fontWeight: 700,
                color: "var(--heading)",
                marginBottom: 8,
              }}
            >
              Open to new opportunities
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
              Full-Stack Internships · Frontend Roles · Freelance UI/UX
            </div>
          </div>
        </div>
      </div>

      {/* closing call-to-action */}
      <div
        className="fade-up"
        style={{
          marginTop: 90,
          paddingTop: 60,
          paddingBottom: 56,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 28,
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: "clamp(36px, 5.2vw, 68px)",
            lineHeight: 1,
            letterSpacing: "-.02em",
            color: "var(--heading)",
            maxWidth: 640,
          }}
        >
          Open to Frontend / Full-Stack Roles
        </h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
            View Resume ↗
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            LinkedIn ↗
          </a>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "22px 0",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: ".1em",
          color: "var(--muted2)",
        }}
      >
        <span>
          Local time · {CITY}
          {time ? ` · ${time} IST` : ""}
        </span>
        <span>© {new Date().getFullYear()} Abhyanshu Raj</span>
      </div>
    </section>
  );
}

const card: CSSProperties = {
  padding: "20px 22px",
  border: "1px solid var(--border)",
  borderRadius: 14,
  background: "var(--surface)",
};
const label: CSSProperties = {
  marginBottom: 8,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: ".2em",
  textTransform: "uppercase",
  color: "var(--muted2)",
};
const value: CSSProperties = { fontSize: 14, color: "var(--heading)", fontWeight: 600 };
