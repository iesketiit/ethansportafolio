"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, onIntroDone, prefersReducedMotion } from "@/lib/motion";
import { site } from "@/data/site";
import TokyoBadge from "./TokyoBadge";

const BASE_WEIGHT = 700;

// Notas escritas con "tinta invisible": solo se ven bajo la lámpara UV del cursor
const notes = [
  { text: "Columbia University, NY", x: 6, y: 17, r: -6 },
  { text: "Nueva York → Japón", x: 36, y: 13, r: 3 },
  { text: "Next.js + Supabase + TypeScript", x: 58, y: 26, r: -3 },
  { text: "doble clic = firma ✍", x: 8, y: 36, r: 4 },
  { text: "↓ agárrame y lánzame", x: 33, y: 40, r: -5 },
  { text: "Harvard + NextU", x: 84, y: 66, r: 7 },
  { text: "↑ ↑ ↓ ↓ ← → ← → B A", x: 42, y: 90, r: -2 },
];

const BASE_WIDTH = 86;

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  // Entrada después del preloader + parallax al hacer scroll
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.set(".hero__letter", { yPercent: 105 });
      gsap.set(".hero__fade", { opacity: 0, y: 24 });

      const off = onIntroDone(() => {
        gsap.to(".hero__letter", {
          yPercent: 0,
          duration: 1.4,
          ease: "power4.out",
          stagger: 0.07,
          // Al terminar, las letras pueden salir de su máscara para lanzarlas
          onComplete: () => root.current?.classList.add("is-ready"),
        });
        gsap.to(".hero__fade", { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.12, delay: 0.5 });
      });

      gsap.to(".hero__name", {
        yPercent: 30,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      return off;
    },
    { scope: root },
  );

  // Las letras cambian de grosor y ancho según la cercanía del cursor
  useEffect(() => {
    const hero = root.current;
    if (!hero || !hasFinePointer() || prefersReducedMotion()) return;
    const letters = Array.from(hero.querySelectorAll<HTMLElement>(".hero__letter"));

    const move = (e: PointerEvent) => {
      const radius = window.innerWidth * 0.3;
      for (const letter of letters) {
        const r = letter.getBoundingClientRect();
        const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const k = Math.max(0, 1 - dist / radius);
        gsap.to(letter, {
          "--w": BASE_WEIGHT - 480 * k,
          "--d": BASE_WIDTH + 14 * k,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };
    const leave = () =>
      gsap.to(letters, { "--w": BASE_WEIGHT, "--d": BASE_WIDTH, duration: 1.2, ease: "power3.out" });

    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);

    // Lámpara UV: revela la tinta invisible alrededor del cursor
    const uv = hero.querySelector<HTMLElement>(".uv");
    const lamp = { r: 0 };
    const setLamp = () => uv?.style.setProperty("--r", `${lamp.r}px`);
    const uvMove = (e: PointerEvent) => {
      if (!uv) return;
      const r = hero.getBoundingClientRect();
      uv.style.setProperty("--mx", `${e.clientX - r.left}px`);
      uv.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const uvEnter = () => gsap.to(lamp, { r: 170, duration: 0.6, ease: "power3.out", onUpdate: setLamp });
    const uvLeave = () => gsap.to(lamp, { r: 0, duration: 0.5, ease: "power2.in", onUpdate: setLamp });
    hero.addEventListener("pointermove", uvMove);
    hero.addEventListener("pointerenter", uvEnter);
    hero.addEventListener("pointerleave", uvLeave);

    // Agarra una letra, arrástrala y suéltala: sale disparada y vuelve rebotando
    const cleanups = letters.map((letter) => {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let vx = 0;
      let vy = 0;
      let lastX = 0;
      let lastY = 0;
      let lastT = 0;

      const down = (e: PointerEvent) => {
        if (!hero.classList.contains("is-ready")) return;
        dragging = true;
        letter.setPointerCapture(e.pointerId);
        gsap.killTweensOf(letter, "x,y,rotation");
        startX = e.clientX - Number(gsap.getProperty(letter, "x"));
        startY = e.clientY - Number(gsap.getProperty(letter, "y"));
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = performance.now();
        letter.classList.add("is-grabbed");
      };
      const drag = (e: PointerEvent) => {
        if (!dragging) return;
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        vx = (e.clientX - lastX) / dt;
        vy = (e.clientY - lastY) / dt;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = now;
        const x = e.clientX - startX;
        const y = e.clientY - startY;
        gsap.set(letter, { x, y, rotation: gsap.utils.clamp(-35, 35, x * 0.06 + vx * 6) });
      };
      const up = () => {
        if (!dragging) return;
        dragging = false;
        letter.classList.remove("is-grabbed");
        const x = Number(gsap.getProperty(letter, "x"));
        const y = Number(gsap.getProperty(letter, "y"));
        gsap
          .timeline()
          .to(letter, {
            x: x + vx * 260,
            y: y + vy * 260,
            rotation: `+=${vx * 90}`,
            duration: 0.45,
            ease: "power2.out",
          })
          .to(letter, { x: 0, y: 0, rotation: 0, duration: 1.8, ease: "elastic.out(1, 0.28)" });
      };

      letter.addEventListener("pointerdown", down);
      letter.addEventListener("pointermove", drag);
      letter.addEventListener("pointerup", up);
      letter.addEventListener("pointercancel", up);
      return () => {
        letter.removeEventListener("pointerdown", down);
        letter.removeEventListener("pointermove", drag);
        letter.removeEventListener("pointerup", up);
        letter.removeEventListener("pointercancel", up);
      };
    });

    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      hero.removeEventListener("pointermove", uvMove);
      hero.removeEventListener("pointerenter", uvEnter);
      hero.removeEventListener("pointerleave", uvLeave);
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <section className="hero" id="inicio" data-tone="dark" ref={root}>
      <div className="uv" aria-hidden="true">
        {notes.map((n) => (
          <span className="uv__note" key={n.text} style={{ left: `${n.x}%`, top: `${n.y}%`, rotate: `${n.r}deg` }}>
            {n.text}
          </span>
        ))}
      </div>

      <p className="hero__intro hero__fade">
        Comunicador social y desarrollador web. Formado en Columbia University, con experiencia profesional en Japón.
      </p>

      <h1 className="hero__name" aria-label={site.name}>
        {Array.from(site.name).map((ch, i) => (
          <span className="hero__mask" key={i} aria-hidden="true">
            <span className="hero__letter" data-cursor={ch === " " ? undefined : "Lánzame"}>{ch === " " ? "\u00A0" : ch}</span>
          </span>
        ))}
      </h1>

      <div className="hero__bottom hero__fade">
        <p>Diseño y desarrollo sitios web con movimiento e integraciones con IA para marcas de eventos, e-commerce, arquitectura, hotelería y moda.</p>
        <div className="hero__side">
          <TokyoBadge />
          <span className="hero__cue">
            Desliza <span aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
}
