"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useLenis } from "./SmoothScroll";
import { playWhoosh } from "@/lib/sound";
import { site } from "@/data/site";

type Navigate = (href: string) => void;

const NavigateContext = createContext<Navigate>(() => {});

export const useNavigate = () => useContext(NavigateContext);

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const lenisRef = useRef(lenis);
  const curtain = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const pendingHash = useRef<string | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  // GSAP toma el control del transform: sin esto leería el translateY(100%) del CSS como píxeles
  useEffect(() => {
    if (curtain.current) gsap.set(curtain.current, { y: 0, yPercent: 100 });
  }, []);

  const scrollToHash = useCallback((hash: string, immediate = false) => {
    const el = document.querySelector<HTMLElement>(hash);
    if (!el) return;
    const l = lenisRef.current;
    if (l) l.scrollTo(el, { immediate, duration: 1.4 });
    else el.scrollIntoView({ behavior: immediate ? "auto" : "smooth" });
  }, []);

  const navigate = useCallback<Navigate>(
    (href) => {
      if (busy.current) return;
      const url = new URL(href, window.location.href);

      if (url.origin !== window.location.origin) {
        window.open(url.href, "_blank", "noopener,noreferrer");
        return;
      }

      const hash = url.hash || null;

      // Misma página: solo scroll
      if (url.pathname === window.location.pathname) {
        if (hash) scrollToHash(hash);
        else if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      pendingHash.current = hash;

      if (prefersReducedMotion() || !curtain.current) {
        router.push(url.pathname + (hash ?? ""));
        return;
      }

      busy.current = true;
      lenisRef.current?.stop();
      playWhoosh();
      gsap.fromTo(
        curtain.current,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.8,
          ease: "power4.inOut",
          onComplete: () => router.push(url.pathname, { scroll: false }),
        },
      );
    },
    [router, scrollToHash],
  );

  // Cuando la nueva página ya está montada: subir y revelar
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const hash = pendingHash.current;
    pendingHash.current = null;

    window.scrollTo(0, 0);
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });

    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (hash) scrollToHash(hash, true);

      if (!busy.current || !curtain.current) return;
      const el = curtain.current;
      gsap.to(el, {
        yPercent: -100,
        duration: 0.9,
        delay: 0.1,
        ease: "power4.inOut",
        onComplete: () => {
          gsap.set(el, { yPercent: 100 });
          busy.current = false;
          lenisRef.current?.start();
        },
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname, scrollToHash]);

  return (
    <NavigateContext.Provider value={navigate}>
      {children}
      <div className="curtain" ref={curtain} aria-hidden="true">
        <span>{site.name}</span>
      </div>
    </NavigateContext.Provider>
  );
}
