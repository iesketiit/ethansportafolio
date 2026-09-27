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

/** Gotas de tinta que chorrean del título, se desprenden y caen */
function drip(el: HTMLElement) {
  const words = Array.from(el.querySelectorAll<HTMLElement>(".split__word"));
  if (!words.length) return;
  const base = el.getBoundingClientRect();
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const w of words) {
    const r = w.getBoundingClientRect();
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }

  const box = document.createElement("div");
  box.className = "drips";
  box.setAttribute("aria-hidden", "true");
  box.style.left = `${left - base.left}px`;
  box.style.width = `${right - left}px`;
  // Las gotas nacen pegadas a la línea base de las letras
  const lift = parseFloat(getComputedStyle(el).fontSize) * 0.24;
  box.style.top = `${bottom - base.top - lift}px`;
  el.appendChild(box);

  const count = 3 + Math.floor(Math.random() * 3);
  const master = gsap.timeline({ onComplete: () => box.remove() });

  for (let i = 0; i < count; i++) {
    const w = gsap.utils.random(7, 15);
    const h = gsap.utils.random(35, 110);
    const x = gsap.utils.random(4, 94);

    const pool = document.createElement("span");
    pool.className = "drip-pool";
    pool.style.left = `calc(${x}% - ${w * 0.8}px)`;
    pool.style.width = `${w * 2.6}px`;
    const stem = document.createElement("span");
    stem.className = "drip";
    stem.style.left = `${x}%`;
    stem.style.width = `${w}px`;
    const drop = document.createElement("span");
    drop.className = "drop";
    drop.style.left = `calc(${x}% - ${w * 0.18}px)`;
    drop.style.width = drop.style.height = `${w * 1.36}px`;
    box.append(pool, stem, drop);

    const tl = gsap.timeline();
    tl.to(stem, { height: h, duration: gsap.utils.random(1.2, 2), ease: "power1.in" })
      .set(drop, { y: h - w * 0.7, opacity: 1 })
      .to(stem, { height: h * 0.7, duration: 0.25, ease: "power2.out" })
      .to(drop, { y: h + 260, duration: 0.9, ease: "power2.in" }, "<")
      .to(drop, { opacity: 0, duration: 0.3 }, ">-0.3")
      .to(stem, { height: 0, duration: 1.3, ease: "power2.inOut" }, "-=0.5")
      .to(pool, { scaleX: 0, opacity: 0, duration: 0.8 }, "<0.4");
    master.add(tl, gsap.utils.random(0, 1.4));
  }
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

  // 6. Los títulos gotean tinta al aparecer
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const heads = Array.from(document.querySelectorAll<HTMLElement>(".h2, .contact__title, .case__title"));
    const triggers = heads.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 75%",
        once: true,
        onEnter: () => void gsap.delayedCall(1.7, () => drip(el)),
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      document.querySelectorAll(".drips").forEach((d) => d.remove());
    };
  }, [pathname]);

  // 7. Si te vas a otra pestaña, la web te llama
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
