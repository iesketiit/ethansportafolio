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
        gsap.to(".hero__letter", { yPercent: 0, duration: 1.4, ease: "power4.out", stagger: 0.07 });
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
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
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
            <span className="hero__letter">{ch === " " ? "\u00A0" : ch}</span>
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
