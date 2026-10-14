import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type PixelWipePattern =
  | "random"
  | "center"
  | "edges"
  | "left-to-right"
  | "right-to-left"
  | "top-to-bottom"
  | "bottom-to-top"
  | "diagonal"
  | "spiral";

export type PixelWipeHandle = {
  /**
   * Covers the screen with pixels of `color`, calls `onCover` once everything
   * is covered (switch theme / open store there), then reveals the page again.
   * Resolves when the whole effect is finished.
   */
  run: (options: { color: string; onCover?: () => void }) => Promise<void>;
};

type Props = {
  pixelSize?: number;
  pattern?: PixelWipePattern;
  randomness?: number;
  pixelScale?: number;
  /** Time (ms) for the cover phase and again for the reveal phase */
  duration?: number;
  /** Time (ms) each single pixel takes to animate */
  pixelDuration?: number;
  easing?: string;
  maxPixels?: number;
};

const PATTERNS: Record<PixelWipePattern, (x: number, y: number) => number | null> = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  "left-to-right": (x) => x,
  "right-to-left": (x) => 1 - x,
  "top-to-bottom": (_x, y) => y,
  "bottom-to-top": (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const noise = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrames = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

type Cell = { left: number; top: number; width: number; height: number; offset: number };

function buildCells(
  width: number,
  height: number,
  pixelSize: number,
  pattern: PixelWipePattern,
  randomness: number,
  maxPixels: number,
): Cell[] {
  let size = Math.max(8, pixelSize);
  let columns = Math.max(1, Math.ceil(width / size));
  let rows = Math.max(1, Math.ceil(height / size));
  if (columns * rows > maxPixels) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / maxPixels));
    columns = Math.max(1, Math.ceil(width / size));
    rows = Math.max(1, Math.ceil(height / size));
  }

  // Cells always tile the screen exactly, so no gaps are left at the end.
  const cellW = width / columns;
  const cellH = height / rows;
  const order = PATTERNS[pattern] ?? PATTERNS.random;
  const mix = clamp(randomness, 0, 1);
  const cells: Cell[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);
      cells.push({
        left: Math.floor(column * cellW),
        top: Math.floor(row * cellH),
        // +1px overlap hides hairline seams between neighbouring pixels
        width: Math.ceil(cellW) + 1,
        height: Math.ceil(cellH) + 1,
        offset: base === null ? random : base * (1 - mix) + random * mix,
      });
    }
  }
  return cells;
}

export const PixelWipe = forwardRef<PixelWipeHandle, Props>(function PixelWipe(
  {
    pixelSize = 80,
    pattern = "random",
    randomness = 0,
    pixelScale = 0.35,
    duration = 650,
    pixelDuration = 320,
    easing = "cubic-bezier(0.22, 1, 0.36, 1)",
    maxPixels = 260,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const animationsRef = useRef<Animation[]>([]);
  const runIdRef = useRef(0);

  const cancelAll = () => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    rootRef.current?.replaceChildren();
  };

  useEffect(() => () => cancelAll(), []);

  useImperativeHandle(ref, () => ({
    run: async ({ color, onCover }) => {
      const root = rootRef.current;
      const reduceMotion =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!root || reduceMotion) {
        onCover?.();
        return;
      }

      cancelAll();
      const runId = ++runIdRef.current;

      const cells = buildCells(window.innerWidth, window.innerHeight, pixelSize, pattern, randomness, maxPixels);
      const total = Math.max(200, duration);
      const pixelMs = clamp(pixelDuration, 60, total);
      const spread = Math.max(0, total - pixelMs);
      const startScale = clamp(pixelScale, 0.05, 1);

      const fragment = document.createDocumentFragment();
      const elements = cells.map((cell) => {
        const element = document.createElement("div");
        element.style.cssText =
          `position:absolute;left:${cell.left}px;top:${cell.top}px;` +
          `width:${cell.width}px;height:${cell.height}px;background:${color};` +
          "opacity:0;will-change:transform,opacity;";
        fragment.appendChild(element);
        return element;
      });
      root.appendChild(fragment);

      const play = (from: Keyframe, to: Keyframe) =>
        elements.map((element, index) =>
          element.animate([from, to], {
            duration: pixelMs,
            delay: cells[index].offset * spread,
            easing,
            fill: "both",
          }),
        );

      try {
        // 1) cover the screen
        const cover = play(
          { opacity: 0, transform: `scale(${startScale})` },
          { opacity: 1, transform: "scale(1)" },
        );
        animationsRef.current = cover;
        await Promise.all(cover.map((animation) => animation.finished));
        if (runId !== runIdRef.current) return;

        // 2) page changes underneath while it is fully covered
        onCover?.();
        await nextFrames();
        await sleep(60);
        if (runId !== runIdRef.current) return;

        // 3) reveal again
        const reveal = play(
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: `scale(${startScale})` },
        );
        animationsRef.current = reveal;
        await Promise.all(reveal.map((animation) => animation.finished));
      } catch {
        // animation cancelled by a newer run or unmount
      } finally {
        if (runId === runIdRef.current) cancelAll();
      }
    },
  }));

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 8999, pointerEvents: "none", overflow: "hidden" }}
    />
  );
});

export default PixelWipe;
