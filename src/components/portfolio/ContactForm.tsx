import { useState, type FormEvent, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.from("contact_messages").insert({ name, email, message });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setName("");
    setEmail("");
    setMessage("");
  }

  if (status === "sent") {
    return (
      <div style={cardStyle}>
        <p style={{ fontSize: 14, color: "var(--heading)" }}>
          Thanks{name ? `, ${name}` : ""} — your message is in. I'll get back to you soon.
        </p>
        <button onClick={() => setStatus("idle")} style={ghostBtn}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <input
          type="text"
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </div>
      <textarea
        required
        placeholder="What's on your mind?"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }}
      />
      {status === "error" && (
        <p style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 10 }}>
          Something went wrong sending that — please try again, or email me directly.
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="btn-primary" style={{ opacity: status === "sending" ? 0.6 : 1 }}>
        {status === "sending" ? "Sending…" : "Send Message ↗"}
      </button>
    </form>
  );
}

const cardStyle: CSSProperties = {
  maxWidth: 560,
  padding: 24,
  border: "1px solid var(--border)",
  borderRadius: 14,
  background: "var(--surface)",
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
  marginTop: 14,
  padding: "9px 18px",
  borderRadius: 999,
  border: "1px solid var(--border-strong)",
  background: "transparent",
  color: "var(--heading)",
  fontSize: 12,
  cursor: "pointer",
};
