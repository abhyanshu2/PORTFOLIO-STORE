import { useCallback, useEffect, useState } from "react";

export type PhotoState = {
  src: string;
  x: number;
  y: number;
  scale: number;
};

export type PinState = { x: number; y: number; s?: number };

export type ScrapbookState = {
  texts: Record<string, string>;
  photos: Record<string, PhotoState>;
  pins: Record<string, PinState>;
};

const STORAGE_KEY = "birthday-scrapbook-v1";

const empty: ScrapbookState = { texts: {}, photos: {}, pins: {} };

let state: ScrapbookState = empty;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full — keep the in-memory edits, warn once
    if (typeof window !== "undefined") {
      console.warn("Could not save: browser storage is full. Try smaller/fewer photos.");
    }
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ScrapbookState>;
      state = {
        texts: parsed.texts ?? {},
        photos: parsed.photos ?? {},
        pins: parsed.pins ?? {},
      };
      emit();
    }
  } catch {
    state = empty;
  }
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setText(id: string, value: string) {
  state = { ...state, texts: { ...state.texts, [id]: value } };
  persist();
  emit();
}

export function setPhoto(id: string, photo: PhotoState | null) {
  const photos = { ...state.photos };
  if (photo) photos[id] = photo;
  else delete photos[id];
  state = { ...state, photos };
  persist();
  emit();
}

export function setPin(id: string, pin: PinState | null) {
  const pins = { ...state.pins };
  if (pin) pins[id] = pin;
  else delete pins[id];
  state = { ...state, pins };
  persist();
  emit();
}

export function resetScrapbook() {
  state = { texts: {}, photos: {}, pins: {} };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

function useStoreSlice<T>(select: (s: ScrapbookState) => T): T {
  const [value, setValue] = useState<T>(() => select(state));
  useEffect(() => {
    const update = () => setValue(select(state));
    update();
    return subscribe(update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function useText(id: string, fallback: string) {
  const stored = useStoreSlice((s) => s.texts[id]);
  return stored ?? fallback;
}

export function usePhoto(id: string) {
  return useStoreSlice((s) => s.photos[id]);
}

export function usePin(id: string) {
  return useStoreSlice((s) => s.pins[id]);
}

/** Desktop / fine-pointer detection for the "pin anywhere" feature. */
export function useDesktopPinning() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return enabled;
}

export const useHydrated = () => {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
};

/** Resize + compress a picked file into a data URL that fits in localStorage. */
export async function fileToDataUrl(file: File, max = 1400): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
