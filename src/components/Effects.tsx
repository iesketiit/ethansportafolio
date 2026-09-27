"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { createSignatureSvg, drawSignature } from "@/lib/signature";
import { playClick, playHover, playScratch } from "@/lib/sound";

type Tone = "dark" | "blue" | "light";

const TONES: Record<Tone, { "--bg": string; "--fg": string; "--muted": string; "--rule": string }> = {
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

  // 3. Velocidad del scroll: títulos con separación RGB y paneles de proyecto tipo gelatina
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = document.documentElement;
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".proj"));
    const skews = panels.map((p) => gsap.quickSetter(p, "skewY", "deg"));
    let target = 0;
    let vel = 0;
    let last = "";

    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        target = self.getVelocity();
      },
    });

    const tick = () => {
      target *= 0.88;
      vel += (target - vel) * 0.18;
      const v = gsap.utils.clamp(-14, 14, vel / 160);
      const value = Math.abs(v) < 0.05 ? "0" : v.toFixed(2);
      if (value !== last) {
        root.style.setProperty("--vel", value);
        const skew = gsap.utils.clamp(-4, 4, v * 0.35);
        skews.forEach((set) => set(Math.abs(skew) < 0.02 ? 0 : skew));
        last = value;
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      root.style.setProperty("--vel", "0");
      panels.forEach((p) => gsap.set(p, { skewY: 0 }));
    };
  }, [pathname]);

  // 4. Sonidos y texto que se revuelve al pasar el cursor
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
      stamp.style.rotate = `${gsap.utils.random(-10, 6)}deg`;
      const svg = createSignatureSvg();
      stamp.appendChild(svg);
      document.body.appendChild(stamp);
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

  // 6. Si te vas a otra pestaña, la web te llama
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
