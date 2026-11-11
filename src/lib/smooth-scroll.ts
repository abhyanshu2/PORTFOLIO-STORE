import Lenis from "lenis";

export const smoothEase = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function startLenis(lenis: Lenis) {
  let raf = 0;
  const loop = (time: number) => {
    lenis.raf(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    lenis.destroy();
  };
}

export function scrollMargin(el: Element) {
  return parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
}

export { Lenis };
