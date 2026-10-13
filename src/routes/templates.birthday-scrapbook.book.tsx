import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, MessageCircle, Send } from "lucide-react";
import { EditableText } from "@/components/templates/birthday-scrapbook/EditableText";
import { PhotoFrame } from "@/components/templates/birthday-scrapbook/PhotoFrame";
import { FilmEdge, Hint, SiteNav } from "@/components/templates/birthday-scrapbook/Chrome";
import { clamp, useDesktopPinning } from "@/lib/scrapbook-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/templates/birthday-scrapbook/book")({
  head: () => ({
    meta: [
      { title: "Birthday Scrapbook — Flip Through Every Page" },
      {
        name: "description",
        content:
          "A flip-through birthday scrapbook: turn the pages with your mouse, add your own photos and edit every note.",
      },
      { property: "og:title", content: "Birthday Scrapbook — Flip Through Every Page" },
      {
        property: "og:description",
        content: "Turn the pages, add photos and write your own notes in this birthday scrapbook.",
      },
    ],
  }),
  component: BookPage,
});

/* ── page furniture ─────────────────────────────────────────── */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-caption text-[9px] uppercase tracking-[0.28em] text-[var(--pin-red)]">
      {children}
    </p>
  );
}

function Sticky({ id, text, tone }: { id: string; text: string; tone: string }) {
  return (
    <div
      className="rotate-[-1.5deg] p-2 font-note text-[11px] leading-snug text-[var(--ink)] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)]"
      style={{ background: tone }}
    >
      <EditableText id={id} defaultValue={text} multiline />
    </div>
  );
}

/* ── the 16 pages (8 spreads) ───────────────────────────────── */

function pages(): React.ReactNode[] {
  return [
    // 1 — cover
    <div key="p1" className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <Kicker>a little book for you</Kicker>
      <h2 className="font-script text-4xl leading-none text-[var(--pin-red)] sm:text-5xl">
        Happy
        <br />
        Birthday
      </h2>
      <p className="font-display text-lg tracking-wide text-[var(--ink)]">
        <EditableText id="book.name" defaultValue="Your Name" />
      </p>
      <p className="font-note text-[11px] italic text-[var(--ink-soft)]">
        from <EditableText id="book.from" defaultValue="me, always" />
      </p>
    </div>,

    // 2 — cover right: hero photo
    <div key="p2" className="flex h-full flex-col justify-center gap-3">
      <PhotoFrame id="b.cover" ratio="4 / 5" pin caption={null} />
      <p className="text-center font-note text-[11px] italic text-[var(--ink-soft)]">
        <EditableText id="book.coverCaption" defaultValue="the day it all felt bright" />
      </p>
    </div>,

    // 3 — new chapter wish
    <div key="p3" className="flex h-full flex-col justify-center gap-3">
      <Kicker>a new chapter</Kicker>
      <p className="font-note text-[12px] leading-relaxed text-[var(--ink)]">
        <EditableText
          id="book.wish"
          multiline
          defaultValue={
            "May this new chapter of your life be filled with exciting opportunities, meaningful moments, and unexpected blessings. May happiness follow you wherever you go, and may your heart always remain hopeful and strong."
          }
        />
      </p>
    </div>,

    // 4
    <div key="p4" className="flex h-full items-center justify-center">
      <PhotoFrame id="b.wish" ratio="3 / 4" pin rotate={-2} className="w-4/5" />
    </div>,

    // 5 — date
    <div key="p5" className="flex h-full flex-col items-center justify-center gap-1 text-center">
      <p className="font-note text-[11px] italic text-[var(--ink-soft)]">
        <EditableText id="book.dateNote" defaultValue="someone wonderful was born on this day" />
      </p>
      <p className="font-display text-2xl text-[var(--ink)]">
        <EditableText id="book.month" defaultValue="April" />
      </p>
      <p className="font-display text-6xl leading-none text-[var(--pin-red)]">
        <EditableText id="book.day" defaultValue="22" />
      </p>
      <p className="font-caption mt-2 text-[9px] uppercase tracking-[0.24em] text-[var(--ink-soft)]">
        <EditableText id="book.dateSub" defaultValue="celebrating the loveliest human today" />
      </p>
    </div>,

    // 6
    <div key="p6" className="grid h-full grid-cols-2 items-center gap-3">
      <PhotoFrame id="b.date1" ratio="3 / 4" pin rotate={-2.5} />
      <PhotoFrame id="b.date2" ratio="3 / 4" pin rotate={2} />
    </div>,

    // 7 — photo strip
    <div key="p7" className="flex h-full flex-col justify-center gap-2">
      <Kicker>film strip</Kicker>
      <div className="flex flex-col gap-1 bg-[var(--ink)] p-1.5">
        <PhotoFrame id="b.strip1" ratio="4 / 3" polaroid={false} />
        <PhotoFrame id="b.strip2" ratio="4 / 3" polaroid={false} />
        <PhotoFrame id="b.strip3" ratio="4 / 3" polaroid={false} />
      </div>
    </div>,

    // 8
    <div key="p8" className="flex h-full flex-col justify-center gap-3">
      <PhotoFrame id="b.strip4" ratio="1 / 1" pin rotate={1.4} />
      <p className="font-note text-[11px] leading-relaxed text-[var(--ink)]">
        <EditableText
          id="book.stripNote"
          multiline
          defaultValue="Every frame here is a day I'd happily live again with you."
        />
      </p>
    </div>,

    // 9 — social post
    <div key="p9" className="flex h-full flex-col justify-center">
      <div className="border border-[var(--paper-shade)] bg-[var(--paper)] shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--paper-shade)] px-2 py-1.5">
          <span className="h-5 w-5 rounded-full bg-[var(--pin-red)]" />
          <span className="font-caption text-[10px] uppercase tracking-widest text-[var(--ink)]">
            <EditableText id="book.handle" defaultValue="@yourhandle" />
          </span>
        </div>
        <PhotoFrame id="b.post" ratio="1 / 1" polaroid={false} />
        <div className="flex gap-3 px-2 py-1.5 text-[var(--pin-red)]">
          <Heart className="h-3.5 w-3.5" />
          <MessageCircle className="h-3.5 w-3.5" />
          <Send className="h-3.5 w-3.5" />
        </div>
        <p className="px-2 pb-2 font-note text-[11px] text-[var(--ink)]">
          <EditableText id="book.postCaption" defaultValue="too cute to be a year older" />
        </p>
      </div>
    </div>,

    // 10
    <div key="p10" className="flex h-full flex-col justify-center gap-3">
      <p className="font-note text-right text-[11px] italic text-[var(--ink-soft)]">
        <EditableText id="book.specialDay" defaultValue="a special day for a truly special person" />
      </p>
      <PhotoFrame id="b.post2" ratio="4 / 5" pin rotate={-1.6} />
    </div>,

    // 11 — things I love
    <div key="p11" className="flex h-full flex-col justify-center gap-2">
      <h3 className="font-display text-xl text-[var(--pin-red)]">
        Things I love about <EditableText id="book.loveWho" defaultValue="you" />
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <Sticky id="book.love1" text="Always makes me laugh" tone="oklch(0.94 0.05 95)" />
        <Sticky id="book.love2" text="Has the cutest smile" tone="oklch(0.92 0.05 200)" />
        <Sticky id="book.love3" text="Gives the best advice" tone="oklch(0.93 0.05 150)" />
        <Sticky id="book.love4" text="Makes every day brighter" tone="oklch(0.93 0.05 30)" />
      </div>
      <Sticky id="book.love5" text="A great friend to everyone" tone="oklch(0.93 0.05 320)" />
    </div>,

    // 12
    <div key="p12" className="flex h-full items-center justify-center">
      <PhotoFrame id="b.love" ratio="3 / 4" pin rotate={2.4} className="w-4/5" />
    </div>,

    // 13 — welcome to 23
    <div key="p13" className="flex h-full flex-col justify-center gap-3">
      <p className="font-script text-3xl text-[var(--pin-red)]">
        Welcome to <EditableText id="book.age" defaultValue="23" />
      </p>
      <p className="font-note text-[12px] leading-relaxed text-[var(--ink)]">
        <EditableText
          id="book.chapter"
          multiline
          defaultValue={
            "A chapter not only about new beginnings, but also about looking back at how far you've come. Every achievement, every lesson, every friendship, and every memory is part of the journey worth celebrating today."
          }
        />
      </p>
    </div>,

    // 14
    <div key="p14" className="grid h-full grid-cols-2 items-center gap-3">
      <PhotoFrame id="b.age1" ratio="3 / 4" pin rotate={-2} />
      <PhotoFrame id="b.age2" ratio="3 / 4" pin rotate={1.8} />
    </div>,

    // 15 — today's movie
    <div key="p15" className="flex h-full flex-col justify-center gap-3">
      <h3 className="font-display text-2xl uppercase tracking-wide text-[var(--pin-red)]">
        Today&apos;s Movie
      </h3>
      <PhotoFrame id="b.movie" ratio="16 / 9" polaroid={false} />
      <div className="font-note text-[11px] leading-relaxed text-[var(--ink)]">
        <p className="font-display text-base">
          The Story of <EditableText id="book.movieName" defaultValue="[Name]" />
        </p>
        <p>
          running time · <EditableText id="book.runtime" defaultValue="104 minutes" />
        </p>
        <p>
          genre · <EditableText id="book.genre" defaultValue="Slice of Life, Comedy, Romance" />
        </p>
        <p>
          main character · <EditableText id="book.character" defaultValue="[Name]" />
        </p>
        <p>
          date release · <EditableText id="book.release" defaultValue="[Birthday date]" />
        </p>
      </div>
    </div>,

    // 16
    <div key="p16" className="flex h-full flex-col items-center justify-center gap-3">
      <PhotoFrame id="b.movie2" ratio="3 / 4" pin rotate={-1.2} className="w-3/4" />
      <p className="font-caption bg-[var(--pin-red)] px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]">
        Directed by <EditableText id="book.director" defaultValue="[Your name]" />
      </p>
    </div>,
  ];
}

/* ── flip book ──────────────────────────────────────────────── */

function BookPage() {
  const desktop = useDesktopPinning();
  const all = pages();
  const leaves = Math.ceil(all.length / 2);
  const [cur, setCur] = useState(0); // turned leaves
  const [drag, setDrag] = useState<{ leaf: number; angle: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setCur((c) => Math.min(leaves, c + 1)), [leaves]);
  const prev = useCallback(() => setCur((c) => Math.max(0, c - 1)), []);

  /* mobile single-page flipping */
  const [mIdx, setMIdx] = useState(0);
  const [mDrag, setMDrag] = useState<{ dir: 1 | -1; p: number } | null>(null);
  const mStart = useRef<{ x: number; dir: 1 | -1 } | null>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowRight") {
        next();
        setMIdx((i) => Math.min(all.length - 1, i + 1));
      }
      if (e.key === "ArrowLeft") {
        prev();
        setMIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, all.length]);

  /* ── desktop: press and slide the mouse to turn ── */
  const startRef = useRef<{ x: number; leaf: number; dir: 1 | -1 } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-turn]")) return;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    startRef.current = { x: e.clientX, leaf: cur, dir: 1 };
    wrapRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = startRef.current;
    const box = wrapRef.current?.getBoundingClientRect();
    if (!start || !box) return;
    const span = box.width * 0.45;
    const dx = e.clientX - start.x;
    // slide left → flip forward, slide right → flip backward
    if (dx < 0 && cur < leaves) {
      const p = clamp(-dx / span, 0, 1);
      startRef.current = { ...start, leaf: cur, dir: 1 };
      setDrag({ leaf: cur, angle: -180 * p });
    } else if (dx > 0 && cur > 0) {
      const p = clamp(dx / span, 0, 1);
      startRef.current = { ...start, leaf: cur - 1, dir: -1 };
      setDrag({ leaf: cur - 1, angle: -180 * (1 - p) });
    } else {
      setDrag(null);
    }
  };

  const onPointerUp = () => {
    const start = startRef.current;
    startRef.current = null;
    if (start && drag) {
      const progress = start.dir === 1 ? -drag.angle / 180 : 1 + drag.angle / 180;
      if (progress > 0.35) (start.dir === 1 ? next : prev)();
    }
    setDrag(null);
  };

  /* ── mobile: swipe to turn with a real page-flip ── */
  const onMDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-turn]")) return;
    mStart.current = { x: e.clientX, dir: 1 };
    mobileRef.current?.setPointerCapture(e.pointerId);
  };
  const onMMove = (e: React.PointerEvent) => {
    const start = mStart.current;
    const box = mobileRef.current?.getBoundingClientRect();
    if (!start || !box) return;
    const dx = e.clientX - start.x;
    const p = clamp(Math.abs(dx) / (box.width * 0.6), 0, 1);
    if (dx < 0 && mIdx < all.length - 1) setMDrag({ dir: 1, p });
    else if (dx > 0 && mIdx > 0) setMDrag({ dir: -1, p });
    else setMDrag(null);
  };
  const onMUp = () => {
    const d = mDrag;
    mStart.current = null;
    if (d && d.p > 0.3) {
      setMIdx((i) => clamp(i + d.dir, 0, all.length - 1));
    }
    setMDrag(null);
  };

  const flipEase = "transform 700ms cubic-bezier(0.22, 0.61, 0.36, 1)";

  return (
    <main className="maroon-bg grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <SiteNav />
      <FilmEdge />
      <FilmEdge side="left" />

      <h1 className="font-script relative z-10 mb-4 text-4xl text-[var(--paper)] sm:text-5xl">
        Happy Birthday
      </h1>

      {/* desktop book */}
      <div
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative z-10 hidden aspect-[3/2] w-full max-w-4xl cursor-grab select-none active:cursor-grabbing md:block"
        style={{ perspective: "2200px" }}
      >
        {/* blank base panels */}
        <div className="absolute inset-0 flex">
          <div className="paper-page h-full w-1/2 shadow-[inset_-16px_0_26px_-22px_rgba(0,0,0,0.6)]" />
          <div className="paper-page h-full w-1/2 shadow-[inset_16px_0_26px_-22px_rgba(0,0,0,0.6)]" />
        </div>

        {/* animated leaves */}
        {Array.from({ length: leaves }).map((_, i) => {
          const turned = i < cur;
          const isDragging = drag?.leaf === i;
          const angle = isDragging ? drag.angle : turned ? -180 : 0;
          return (
            <div
              key={i}
              className="absolute right-0 top-0 h-full w-1/2 origin-left"
              style={{
                transform: `rotateY(${angle}deg)`,
                transformStyle: "preserve-3d",
                transition: isDragging ? "none" : flipEase,
                zIndex: isDragging ? 60 : turned ? 10 + i : 10 + (leaves - i),
                pointerEvents: i === cur || i === cur - 1 ? undefined : "none",
              }}
            >
              <div
                className="paper-page absolute inset-0 overflow-hidden p-6 shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]"
                style={{
                  backfaceVisibility: "hidden",
                  pointerEvents: !turned && !isDragging ? "auto" : "none",
                }}
              >
                {all[i * 2]}
              </div>
              <div
                className="paper-page absolute inset-0 overflow-hidden p-6"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  pointerEvents: turned && !isDragging ? "auto" : "none",
                }}
              >
                {all[i * 2 + 1]}
              </div>
            </div>
          );
        })}

        {/* spiral binding */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-40 flex h-full -translate-x-1/2 flex-col justify-around"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="h-3 w-6 rounded-full border border-[var(--ink-soft)]/50 bg-[var(--paper-shade)]/60"
            />
          ))}
        </div>
      </div>

      {/* mobile: one page at a time, swipe to flip */}
      <div
        ref={mobileRef}
        onPointerDown={onMDown}
        onPointerMove={onMMove}
        onPointerUp={onMUp}
        onPointerCancel={onMUp}
        className="relative z-10 w-full max-w-sm select-none md:hidden"
        style={{ perspective: "1400px", touchAction: "pan-y" }}
      >
        <div className="relative aspect-[3/4]">
          {/* the page underneath (where the swipe is heading) */}
          <div
            className="paper-page absolute inset-0 overflow-hidden p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]"
            style={{ pointerEvents: "none" }}
          >
            {all[clamp(mIdx + (mDrag?.dir ?? 0), 0, all.length - 1)]}
          </div>
          {/* the flipping page */}
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: mDrag?.dir === -1 ? "right center" : "left center",
              transform: `rotateY(${(mDrag ? mDrag.p : 0) * (mDrag?.dir === -1 ? 180 : -180)}deg)`,
              transition: mDrag ? "none" : flipEase,
            }}
          >
            <div
              className="paper-page absolute inset-0 overflow-hidden p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]"
              style={{ backfaceVisibility: "hidden", pointerEvents: mDrag ? "none" : "auto" }}
            >
              {all[mIdx]}
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="font-caption text-[10px] uppercase tracking-[0.24em] text-[var(--paper)]/60">
            {mIdx + 1} / {all.length}
          </span>
        </div>
      </div>

      <div className={cn("relative z-10 mt-5 text-center")}>
        <Hint>
          {desktop
            ? "Hold the mouse button and slide left or right to flip the pages · click any text to edit · + to add a photo"
            : "Swipe left or right to flip the page · tap text to edit · + to add a photo"}
        </Hint>
      </div>
    </main>
  );
}
