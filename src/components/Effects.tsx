"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { createSignatureSvg, drawSignature } from "@/lib/signature";
import { playArcade, playClick, playHover, playScratch } from "@/lib/sound";

type Tone = "dark" | "blue" | "light";

const TONES: Record<Tone, { "--bg": string; "--fg": string; "--muted": string; "--rule": string }> = {
  dark: { "--bg": "#000000", "--fg": "#E9E6DF", "--muted": "#85837C", "--rule": "rgba(233, 230, 223, 0.14)" },
  blue: { "--bg": "#2C46B1", "--fg": "#F2F0EB", "--muted": "#C4CCEB", "--rule": "rgba(242, 240, 235, 0.24)" },
  light: { "--bg": "#EFECE6", "--fg": "#0A0A0A", "--muted": "#67655F", "--rule": "rgba(10, 10, 10, 0.14)" },
};

// Última posición del puntero: de ahí nace la gota de tinta
const pointer = { x: -1, y: -1 };

export default function Effects() {
  const pathname = usePathname();
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener("pointermove", track, { passive: true });
    return () => window.removeEventListener("pointermove", track);
  }, []);

  // 1. Cambio de color por sección: el nuevo color se derrama como tinta desde el cursor
  useEffect(() => {
    const root = document.documentElement;
    let current: Tone | null = null;
    let spreading: gsap.core.Tween | null = null;

    const apply = (tone: Tone, immediate = false) => {
      if (tone === current) return;
      const first = current === null;
      current = tone;
      root.dataset.activeTone = tone;
      const vars = TONES[tone] ?? TONES.dark;
      const { "--bg": bg, ...text } = vars;

      spreading?.progress(1);
      gsap.to(".gl-bg", { opacity: tone === "dark" ? 1 : 0, duration: immediate ? 0 : 1, overwrite: "auto" });

      if (immediate || first || prefersReducedMotion()) {
        gsap.set(root, vars);
        return;
      }

      gsap.to(root, { ...text, duration: 0.8, ease: "power2.out", overwrite: "auto" });

      const x = pointer.x >= 0 ? pointer.x : window.innerWidth / 2;
      const y = pointer.y >= 0 ? pointer.y : window.innerHeight / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40;

      const ink = document.createElement("div");
      ink.className = "ink-spread";
      ink.style.background = bg;
      document.body.appendChild(ink);

      spreading = gsap.fromTo(
        ink,
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        {
          clipPath: `circle(${radius}px at ${x}px ${y}px)`,
          duration: 1.1,
          ease: "power3.inOut",
          onComplete: () => {
            gsap.set(root, { "--bg": bg });
            ink.remove();
            spreading = null;
          },
        },
      );
    };

    current = null;
    apply("dark", true);

    const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]")).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => {
          if (self.isActive) apply((el.dataset.tone as Tone) ?? "dark");
        },
      }),
    );

    return () => {
      spreading?.progress(1);
      triggers.forEach((t) => t.kill());
    };
  }, [pathname]);

  // 2. Barra de progreso de lectura
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // 4. Sonidos al pasar el cursor y al hacer clic
  useEffect(() => {
    let lastHover: Element | null = null;
    const interactive = "a, button, [data-cursor]";

    const over = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const el = target?.closest(interactive) ?? null;
      if (el && el !== lastHover) playHover();
      lastHover = el;
    };

    const down = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest(interactive)) playClick();
    };

    document.addEventListener("mouseover", over);
    document.addEventListener("pointerdown", down);
    return () => {
      document.removeEventListener("mouseover", over);
      document.removeEventListener("pointerdown", down);
    };
  }, []);

  // 5. Doble clic en cualquier parte: la firma de Ethan se estampa ahí
  useEffect(() => {
    const stamps: HTMLElement[] = [];

    const onDouble = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("a, button, input, textarea, select, [contenteditable]")) return;
      window.getSelection()?.removeAllRanges();

      const stamp = document.createElement("div");
      stamp.className = "stamp";
      stamp.style.left = `${e.pageX}px`;
      stamp.style.top = `${e.pageY}px`;

      const svg = createSignatureSvg();
      stamp.appendChild(svg);
      document.body.appendChild(stamp);
      gsap.set(stamp, { xPercent: -50, yPercent: -60, rotation: gsap.utils.random(-10, 6) });
      stamps.push(stamp);

      playScratch(1);

      if (prefersReducedMotion()) {
        gsap.to(stamp, { opacity: 0, delay: 1.5, duration: 0.4, onComplete: () => stamp.remove() });
        return;
      }

      drawSignature(svg, { duration: 1 }).then(() => {
        gsap.to(stamp, {
          opacity: 0,
          filter: "blur(8px)",
          scale: 1.08,
          delay: 1.2,
          duration: 0.8,
          ease: "power2.in",
          onComplete: () => stamp.remove(),
        });
      });
    };

    document.addEventListener("dblclick", onDouble);
    return () => {
      document.removeEventListener("dblclick", onDouble);
      stamps.forEach((s) => s.remove());
    };
  }, []);

  // 7. Secreto: código Konami (o 5 toques al logo en el celular) = modo Tokio neón por 10 s
  useEffect(() => {
    const code = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    let progress = 0;
    let taps: number[] = [];
    let timer = 0;
    let extras: HTMLElement[] = [];

    const off = () => {
      document.documentElement.classList.remove("is-neon");
      window.dispatchEvent(new CustomEvent("ethan:neon", { detail: false }));
      extras.forEach((el) => gsap.to(el, { opacity: 0, duration: 0.5, onComplete: () => el.remove() }));
      extras = [];
    };

    const on = () => {
      window.clearTimeout(timer);
      if (!document.documentElement.classList.contains("is-neon")) {
        document.documentElement.classList.add("is-neon");
        window.dispatchEvent(new CustomEvent("ethan:neon", { detail: true }));
        playArcade();

        const sign = document.createElement("div");
        sign.className = "neon-sign";
        sign.setAttribute("aria-hidden", "true");
        sign.textContent = "ネオン東京";
        const scan = document.createElement("div");
        scan.className = "neon-scan";
        scan.setAttribute("aria-hidden", "true");
        const toast = document.createElement("div");
        toast.className = "neon-toast";
        toast.setAttribute("role", "status");
        toast.textContent = "Modo Tokio neón activado";
        document.body.append(scan, sign, toast);
        extras = [scan, sign, toast];
        gsap.set(sign, { yPercent: -50 });
        gsap.set(toast, { xPercent: -50 });
        gsap.from(sign, { opacity: 0, x: 60, duration: 0.6, ease: "power3.out" });
        gsap.fromTo(toast, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(2)" });
        gsap.to(toast, { opacity: 0, y: -10, delay: 2.5, duration: 0.5 });
      }
      timer = window.setTimeout(off, 10_000);
    };

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === code[progress]) {
        progress++;
        if (progress === code.length) {
          progress = 0;
          on();
        }
      } else {
        progress = key === code[0] ? 1 : 0;
      }
    };

    const onTap = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest(".nav__logo")) return;
      const now = performance.now();
      taps = [...taps.filter((t) => now - t < 2000), now];
      if (taps.length >= 5) {
        taps = [];
        on();
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onTap);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onTap);
      window.clearTimeout(timer);
      extras.forEach((el) => el.remove());
      document.documentElement.classList.remove("is-neon");
    };
  }, []);

  // 8. Si te vas a otra pestaña, la web te llama
  useEffect(() => {
    let saved = "";
    const onVisibility = () => {
      if (document.hidden) {
        saved = document.title;
        document.title = "Vuelve, falta tu firma ✍️";
      } else if (saved) {
        document.title = saved;
        saved = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className="progress" aria-hidden="true">
      <span ref={bar} />
    </div>
  );
}
