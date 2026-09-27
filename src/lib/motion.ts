export const INTRO_EVENT = "ethan:intro-done";

declare global {
  interface Window {
    __ethanIntroDone?: boolean;
  }
}

/** Ejecuta cb cuando el preloader termina (o de inmediato si ya terminó). */
export function onIntroDone(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.__ethanIntroDone) {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(INTRO_EVENT, handler, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, handler);
}

export function markIntroDone() {
  if (window.__ethanIntroDone) return;
  window.__ethanIntroDone = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
