"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, onIntroDone, prefersReducedMotion } from "@/lib/motion";
import { site } from "@/data/site";

const BASE_WEIGHT = 700;
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
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <section className="hero" id="inicio" data-tone="dark" ref={root}>
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
        <p>Diseño y desarrollo sitios web con movimiento para marcas de e-commerce, arquitectura, hotelería y moda.</p>
        <span className="hero__cue">
          Desliza <span aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
