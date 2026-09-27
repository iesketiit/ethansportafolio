"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { playClick, playHover } from "@/lib/sound";

type Tone = "dark" | "blue" | "light";

const TONES: Record<Tone, Record<string, string>> = {
  dark: { "--bg": "#000000", "--fg": "#E9E6DF", "--muted": "#85837C", "--rule": "rgba(233, 230, 223, 0.14)" },
  blue: { "--bg": "#2C46B1", "--fg": "#F2F0EB", "--muted": "#C4CCEB", "--rule": "rgba(242, 240, 235, 0.24)" },
  light: { "--bg": "#EFECE6", "--fg": "#0A0A0A", "--muted": "#67655F", "--rule": "rgba(10, 10, 10, 0.14)" },
};

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/\\[]{}?";

function scramble(el: HTMLElement) {
  if (el.dataset.scrambling) return;
  const original = el.dataset.text ?? el.textContent ?? "";
  el.dataset.text = original;
  el.dataset.scrambling = "1";
  let frame = 0;
  const total = original.length + 8;
  const id = window.setInterval(() => {
    frame++;
    el.textContent = Array.from(original)
      .map((ch, i) =>
        ch === " " || i < frame - 8 ? ch : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)],
      )
      .join("");
    if (frame >= total) {
      window.clearInterval(id);
      el.textContent = original;
      delete el.dataset.scrambling;
    }
  }, 32);
}

export default function Effects() {
  const pathname = usePathname();
  const bar = useRef<HTMLSpanElement>(null);

  // Cambio de color del fondo según la sección visible
  useEffect(() => {
    const root = document.documentElement;
    let current: Tone | null = null;

    const apply = (tone: Tone, immediate = false) => {
      if (tone === current) return;
      current = tone;
      root.dataset.activeTone = tone;
      const vars = TONES[tone] ?? TONES.dark;
      const duration = immediate || prefersReducedMotion() ? 0 : 0.9;
      gsap.to(root, { ...vars, duration, ease: "power2.out", overwrite: "auto" });
      gsap.to(".gl-bg", { opacity: tone === "dark" ? 1 : 0, duration, overwrite: "auto" });
    };

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

    return () => triggers.forEach((t) => t.kill());
  }, [pathname]);

  // Barra de progreso de lectura
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

  // Sonidos y texto que se revuelve al pasar el cursor
  useEffect(() => {
    let lastHover: Element | null = null;
    const interactive = "a, button, [data-cursor]";

    const over = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const el = target?.closest(interactive) ?? null;
      if (el && el !== lastHover) playHover();
      lastHover = el;

      const scrambleEl = target?.closest<HTMLElement>("[data-scramble]");
      const from = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (scrambleEl && !(from && scrambleEl.contains(from)) && !prefersReducedMotion()) scramble(scrambleEl);
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

  return (
    <div className="progress" aria-hidden="true">
      <span ref={bar} />
    </div>
  );
}
