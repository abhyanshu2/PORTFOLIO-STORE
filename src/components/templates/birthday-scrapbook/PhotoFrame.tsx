import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clamp,
  fileToDataUrl,
  setPhoto,
  setPin,
  usePhoto,
  usePin,
  type PhotoState,
} from "@/lib/scrapbook-store";

type Props = {
  id: string;
  className?: string;
  /** aspect ratio of the picture window, e.g. "3 / 4" */
  ratio?: string;
  /** show a red push pin on top */
  pin?: boolean;
  /** allow free "pin anywhere" dragging on desktop */
  pinnable?: boolean;
  polaroid?: boolean;
  caption?: React.ReactNode;
  rotate?: number;
  style?: React.CSSProperties;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function PhotoFrame({
  id,
  className,
  ratio = "3 / 4",
  pin = false,
  pinnable = false,
  polaroid = true,
  caption,
  rotate = 0,
  style,
}: Props) {
  const photo = usePhoto(id);
  const freePin = usePin(id);
  const inputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const transformRef = useRef<PhotoState | undefined>(photo);
  useEffect(() => {
    transformRef.current = photo;
  }, [photo]);

  const commit = useCallback(
    (next: Partial<PhotoState>) => {
      const base = transformRef.current;
      if (!base) return;
      const merged: PhotoState = {
        ...base,
        ...next,
        scale: clamp(next.scale ?? base.scale, MIN_SCALE, MAX_SCALE),
      };
      const limit = (merged.scale - 1) * 50;
      merged.x = clamp(merged.x, -limit, limit);
      merged.y = clamp(merged.y, -limit, limit);
      transformRef.current = merged;
      setPhoto(id, merged);
    },
    [id],
  );

  /* ---- upload ---- */
  const onPick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await fileToDataUrl(file);
      setPhoto(id, { src, x: 0, y: 0, scale: 1 });
    } catch {
      console.warn("Could not read that image");
    } finally {
      setBusy(false);
    }
  };

  /* ---- pan / pinch / wheel-zoom inside the frame ---- */
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !photo) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let startDist = 0;
    let startScale = 1;
    let last: { x: number; y: number } | null = null;

    const rect = () => el.getBoundingClientRect();

    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      if (pointers.size === 1) last = { x: e.clientX, y: e.clientY };
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        startDist = Math.hypot(a.x - b.x, a.y - b.y);
        startScale = transformRef.current?.scale ?? 1;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const box = rect();

      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (startDist > 0) commit({ scale: startScale * (dist / startDist) });
        return;
      }
      if (!last) return;
      const dx = ((e.clientX - last.x) / box.width) * 100;
      const dy = ((e.clientY - last.y) / box.height) * 100;
      last = { x: e.clientX, y: e.clientY };
      const cur = transformRef.current;
      if (cur) commit({ x: cur.x + dx, y: cur.y + dy });
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) last = null;
      if (pointers.size === 1) last = [...pointers.values()][0] ?? null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const cur = transformRef.current;
      if (cur) commit({ scale: cur.scale * Math.exp(-dy * 0.0015) });
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [photo, commit]);

  /* ---- drag the whole frame anywhere (touch + mouse) ---- */
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const sizeRef = useRef<{ d: number; s: number } | null>(null);
  const canFreePin = pinnable;
  const frameScale = freePin?.s ?? 1;

  const onPinDown = (e: React.PointerEvent) => {
    if (!canFreePin) return;
    e.preventDefault();
    e.stopPropagation();
    const start = freePin ?? { x: 0, y: 0 };
    dragRef.current = { ox: e.clientX - start.x, oy: e.clientY - start.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPinMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    setPin(id, {
      x: e.clientX - dragRef.current.ox,
      y: e.clientY - dragRef.current.oy,
      s: frameScale,
    });
  };
  const onPinUp = () => {
    dragRef.current = null;
  };

  /* ---- resize the whole frame (touch-friendly corner handle) ---- */
  const onSizeDown = (e: React.PointerEvent) => {
    if (!canFreePin) return;
    e.preventDefault();
    e.stopPropagation();
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    sizeRef.current = { d: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, s: frameScale };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onSizeMove = (e: React.PointerEvent) => {
    const s0 = sizeRef.current;
    const box = rootRef.current?.getBoundingClientRect();
    if (!s0 || !box) return;
    e.preventDefault();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const d = Math.hypot(e.clientX - cx, e.clientY - cy);
    const next = clamp((s0.s * d) / s0.d, 0.5, 2.5);
    setPin(id, { x: freePin?.x ?? 0, y: freePin?.y ?? 0, s: next });
  };
  const onSizeUp = () => {
    sizeRef.current = null;
  };

  const offset = canFreePin && freePin ? freePin : { x: 0, y: 0 };

  return (
    <div
      ref={rootRef}
      data-no-turn
      className={cn("relative select-none", className)}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotate}deg) scale(${canFreePin ? frameScale : 1})`,
        touchAction: canFreePin ? "none" : undefined,
        ...style,
      }}
    >
      <div
        className={cn(
          "relative",
          polaroid
            ? "bg-[var(--paper)] p-2 pb-8 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.75)]"
            : "bg-[var(--paper)] p-1 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)]",
        )}
      >
        <div
          ref={windowRef}
          style={{ aspectRatio: ratio, touchAction: photo ? "none" : "auto" }}
          className={cn(
            "relative w-full overflow-hidden bg-[var(--paper-shade)]",
            photo && "cursor-grab active:cursor-grabbing",
          )}
        >
          {photo ? (
            <img
              src={photo.src}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
              style={{
                transform: `translate(${photo.x}%, ${photo.y}%) scale(${photo.scale})`,
                transformOrigin: "center center",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Add a photo"
              className="group flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-current transition-transform group-hover:scale-110">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em]">
                {busy ? "loading" : "add photo"}
              </span>
            </button>
          )}

          {photo && (
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 p-1 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-sm bg-[var(--pin-red)] px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--paper)]"
              >
                change
              </button>
              <button
                type="button"
                onClick={() => setPhoto(id, { ...photo, x: 0, y: 0, scale: 1 })}
                aria-label="Reset framing"
                className="rounded-sm bg-[var(--pin-red)] p-1 text-[var(--paper)]"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {caption ? (
          <div className="pt-2 text-center text-[11px] text-[var(--ink)]">{caption}</div>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onPick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {pin && (
        <span
          onPointerDown={onPinDown}
          onPointerMove={onPinMove}
          onPointerUp={onPinUp}
          onPointerCancel={onPinUp}
          title={canFreePin ? "Drag to move" : undefined}
          style={{ touchAction: canFreePin ? "none" : undefined }}
          className={cn(
            "absolute -top-5 left-1/2 z-20 grid h-10 w-10 -translate-x-1/2 place-items-start justify-center pt-1",
            canFreePin ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
          )}
        >
          <span className="relative block h-4 w-4 rounded-full bg-[var(--pin-red)] shadow-[0_3px_6px_rgba(0,0,0,0.55),inset_-2px_-2px_4px_rgba(0,0,0,0.35),inset_2px_2px_3px_rgba(255,255,255,0.6)]">
            <span className="absolute left-[7px] top-3 h-3 w-[2px] rounded-b bg-[color-mix(in_oklab,var(--pin-red)_60%,black)]" />
          </span>
        </span>
      )}

      {canFreePin && (
        <span
          role="slider"
          aria-label="Resize photo frame"
          aria-valuenow={Math.round(frameScale * 100)}
          tabIndex={0}
          onPointerDown={onSizeDown}
          onPointerMove={onSizeMove}
          onPointerUp={onSizeUp}
          onPointerCancel={onSizeUp}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowRight")
              setPin(id, { x: freePin?.x ?? 0, y: freePin?.y ?? 0, s: clamp(frameScale + 0.05, 0.5, 2.5) });
            if (e.key === "ArrowDown" || e.key === "ArrowLeft")
              setPin(id, { x: freePin?.x ?? 0, y: freePin?.y ?? 0, s: clamp(frameScale - 0.05, 0.5, 2.5) });
          }}
          title="Drag to resize"
          style={{ touchAction: "none" }}
          className="absolute -bottom-4 -right-4 z-20 grid h-10 w-10 cursor-nwse-resize place-items-center"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--pin-red)] text-[var(--paper)] shadow-[0_3px_8px_rgba(0,0,0,0.5)]">
            <Maximize2 className="h-3 w-3 rotate-90" />
          </span>
        </span>
      )}
    </div>
  );
}
