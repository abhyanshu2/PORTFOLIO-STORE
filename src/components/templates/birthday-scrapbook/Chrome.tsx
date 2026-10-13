import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { resetScrapbook } from "@/lib/scrapbook-store";

export function FilmEdge({ side = "right" }: { side?: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-0 hidden h-full w-6 flex-col items-center justify-around md:flex ${
        side === "right" ? "right-0" : "left-0"
      }`}
    >
      {["13", "13 A", "14", "14 A"].map((n) => (
        <span
          key={n}
          className="font-caption text-[8px] tracking-[0.3em] text-[var(--paper)]/40"
          style={{ writingMode: "vertical-rl" }}
        >
          FILM NEGATIVE {n}
        </span>
      ))}
    </div>
  );
}

export function SiteNav() {
  return (
    <nav className="fixed right-3 top-3 z-50 flex items-center gap-1 rounded-full bg-[var(--pin-red)]/90 px-1.5 py-1 backdrop-blur">
      <Link
        to="/templates/birthday-scrapbook"
        activeOptions={{ exact: true }}
        activeProps={{ className: "bg-[var(--paper)] text-[var(--pin-red)]" }}
        className="font-caption rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--paper)]"
      >
        Collage
      </Link>
      <Link
        to="/templates/birthday-scrapbook/book"
        activeProps={{ className: "bg-[var(--paper)] text-[var(--pin-red)]" }}
        className="font-caption rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--paper)]"
      >
        Book
      </Link>
      <button
        type="button"
        aria-label="Reset everything"
        title="Clear all photos and text"
        onClick={() => {
          if (confirm("Clear all photos and edited text?")) resetScrapbook();
        }}
        className="grid h-6 w-6 place-items-center rounded-full text-[var(--paper)]/80 hover:text-[var(--paper)]"
      >
        <RotateCcw className="h-3 w-3" />
      </button>
    </nav>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-caption text-[9px] uppercase tracking-[0.22em] text-[var(--paper)]/45">
      {children}
    </p>
  );
}
