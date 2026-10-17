import { useState, type FormEvent, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

const SUBJECTS = ["Job opportunity", "Freelance project", "Collaboration", "Just saying hi"];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    // the messages table has no subject column, so the subject goes on the first line
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message: `Subject: ${subject}\n\n${message}` });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setName("");
    setEmail("");
    setSubject(SUBJECTS[0]);
    setMessage("");
  }

  if (status === "sent") {
    return (
      <div
        style={{
          ...cardStyle,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <p style={{ fontSize: 14, color: "var(--heading)", lineHeight: 1.7 }}>
          Thanks{name ? `, ${name}` : ""}, your message is in. I'll get back to you soon.
        </p>
        <button onClick={() => setStatus("idle")} style={ghostBtn}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <label style={fieldWrap}>
        <span style={labelStyle}>Name</span>
        <input
          type="text"
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={fieldWrap}>
        <span style={labelStyle}>Email</span>
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={fieldWrap}>
        <span style={labelStyle}>Subject</span>
        <span style={{ position: "relative", display: "block" }}>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ ...inputStyle, appearance: "none", paddingRight: 36, cursor: "pointer" }}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "var(--muted)",
              fontSize: 12,
            }}
          >
            ▾
          </span>
        </span>
      </label>
      <label style={fieldWrap}>
        <span style={labelStyle}>Message</span>
        <textarea
          required
          placeholder="Tell me about the opportunity or project…"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
        />
      </label>
      {status === "error" && (
        <p style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 12 }}>
          Something went wrong sending that. Please try again, or email me directly.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary"
        style={{ opacity: status === "sending" ? 0.6 : 1 }}
      >
        {status === "sending" ? "Sending…" : "Send Message ↗"}
      </button>
    </form>
  );
}

const cardStyle: CSSProperties = {
  padding: 24,
  border: "1px solid var(--border)",
  borderRadius: 14,
  background: "var(--surface)",
};
const fieldWrap: CSSProperties = { display: "block", marginBottom: 16 };
const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 7,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--muted)",
};
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface2)",
  color: "var(--heading)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};
const ghostBtn: CSSProperties = {
  padding: "9px 18px",
  borderRadius: 999,
  border: "1px solid var(--border-strong)",
  background: "transparent",
  color: "var(--heading)",
  fontSize: 12,
  cursor: "pointer",
};