"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { onIntroDone, prefersReducedMotion } from "@/lib/motion";

declare global {
  interface Window {
    __ethanLenis?: Lenis;
  }
}

const LenisContext = createContext<Lenis | null>(null);

export const useLenis = () => useContext(LenisContext);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({ lerp: 0.085, smoothWheel: true });
    instance.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Bloquea el scroll mientras corre el preloader
    let off = () => {};
    if (!window.__ethanIntroDone) {
      instance.stop();
      off = onIntroDone(() => instance.start());
    }

    window.__ethanLenis = instance;
    setLenis(instance);

    return () => {
      off();
      gsap.ticker.remove(tick);
      instance.destroy();
      if (window.__ethanLenis === instance) window.__ethanLenis = undefined;
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
