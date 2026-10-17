import type { CSSProperties } from "react";
import { useExperience } from "@/lib/experience";

export function ExperienceSection() {
  const { items, loaded } = useExperience();
  // every entry was removed in the admin panel → hide the whole section
  if (loaded && items.length === 0) return null;

  return (
    // "projects" class is reused only for the section padding and background
    <section className="projects" id="experience">
      <div className="fade-up">
        <div className="section-label">04 Experience</div>
        <h2 className="education-title" style={{ marginBottom: 20 }}>
          WORK
          <br />
          <em style={{ fontStyle: "italic", color: "var(--muted)" }}>Experience</em>
        </h2>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 400, marginBottom: 48 }}>
          Where I've worked and what I've done there.
        </p>
      </div>

      <div className="fade-up" style={{ borderTop: "1px solid var(--border)" }}>
        {items.map((item) => (
          <article key={item.id} style={row}>
            <div style={{ flex: "1 1 420px", minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                <h3 style={roleStyle}>{item.role}</h3>
                {item.current && <span style={currentBadge}>Current</span>}
              </div>
              <div style={placeStyle}>{item.place}</div>
              <ul style={list}>
                {item.points.map((point) => (
                  <li key={point} style={listItem}>
                    <span style={dot} aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="skill-tags">
                {item.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div style={dateStyle}>{item.dates}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 16,
  padding: "34px 0",
  borderBottom: "1px solid var(--border)",
};
const roleStyle: CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "clamp(22px, 2.6vw, 30px)",
  fontWeight: 700,
  color: "var(--heading)",
  lineHeight: 1.15,
};
const currentBadge: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--accent)",
  fontWeight: 600,
};
const placeStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  marginBottom: 16,
};
const list: CSSProperties = {
  listStyle: "none",
  margin: "0 0 20px",
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
const listItem: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  fontSize: 14,
  color: "var(--text)",
  lineHeight: 1.7,
  fontWeight: 400,
};
const dot: CSSProperties = {
  flexShrink: 0,
  width: 5,
  height: 5,
  marginTop: 10,
  borderRadius: "50%",
  background: "var(--accent)",
};
const dateStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  letterSpacing: ".04em",
  color: "var(--muted)",
  whiteSpace: "nowrap",
  paddingTop: 6,
};
