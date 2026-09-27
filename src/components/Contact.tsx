"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { callUrl, site, telUrl, whatsappUrl } from "@/data/site";
import { playWhoosh } from "@/lib/sound";
import Magnetic from "./Magnetic";
import SplitReveal from "./SplitReveal";

// "Contacto" en otros idiomas, flotando desenfocado detrás del título.
// x / y en %, size en vw, blur en px, depth = cuánto reacciona al mouse.
const words = [
  { text: "CONTACT", lang: "en", x: 30, y: 8, size: 6.5, blur: 1.5, opacity: 0.32, depth: 0.7 },
  { text: "KONTAKT", lang: "de", x: 6, y: 20, size: 4.5, blur: 6, opacity: 0.22, depth: 0.3 },
  { text: "連絡", lang: "ja", x: 80, y: 18, size: 6, blur: 3, opacity: 0.3, depth: 0.9 },
  { text: "CONTACTEZ", lang: "fr", x: 70, y: 6, size: 4.8, blur: 2, opacity: 0.26, depth: 0.5 },
  { text: "ΕΠΙΚΟΙΝΩΝΙΑ", lang: "el", x: 50, y: 30, size: 3.4, blur: 5, opacity: 0.2, depth: 0.35 },
  { text: "联系", lang: "zh", x: 7, y: 74, size: 5.5, blur: 7, opacity: 0.22, depth: 0.4 },
  { text: "CONTATTO", lang: "it", x: 22, y: 86, size: 5.8, blur: 1.5, opacity: 0.3, depth: 0.75 },
  { text: "연락", lang: "ko", x: 78, y: 80, size: 5, blur: 5, opacity: 0.24, depth: 0.45 },
  { text: "КОНТАКТ", lang: "ru", x: 88, y: 50, size: 4.2, blur: 6, opacity: 0.2, depth: 0.3 },
  { text: "CONTATO", lang: "pt", x: 55, y: 92, size: 4, blur: 3, opacity: 0.24, depth: 0.55 },
  { text: "連絡先", lang: "ja", x: 40, y: 18, size: 3.2, blur: 8, opacity: 0.18, depth: 0.25 },
  { text: "اتصل", lang: "ar", x: 3, y: 48, size: 5, blur: 4, opacity: 0.22, depth: 0.45 },
];

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  // Aparición + flotación tipo burbuja
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const bubbles = gsap.utils.toArray<HTMLElement>(".bubble__inner");

      gsap.from(bubbles, {
        opacity: 0,
        scale: 0.5,
        duration: 1.6,
        ease: "power3.out",
        stagger: { each: 0.08, from: "random" },
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });

      bubbles.forEach((b) => {
        gsap.to(b, {
          x: gsap.utils.random(-50, 50),
          y: gsap.utils.random(-35, 35),
          scale: gsap.utils.random(0.9, 1.12),
          duration: gsap.utils.random(5, 9),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: gsap.utils.random(0, 2),
        });
      });
    },
    { scope: root },
  );

  // Parallax con el mouse según la profundidad de cada palabra
  useEffect(() => {
    const section = root.current;
    if (!section || !hasFinePointer() || prefersReducedMotion()) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>(".bubble")).map((el) => ({
      depth: Number(el.dataset.depth ?? 0.5),
      x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" }),
      y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" }),
    }));
    const move = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      items.forEach((it) => {
        it.x(-dx * 120 * it.depth);
        it.y(-dy * 80 * it.depth);
      });
    };
    section.addEventListener("pointermove", move);

    // Agujero negro: los botones absorben todas las palabras flotantes
    const pulls = Array.from(section.querySelectorAll<HTMLElement>(".bubble__pull"));
    const buttons = Array.from(section.querySelectorAll<HTMLElement>(".contact__actions .pill"));

    const suck = (btn: HTMLElement) => {
      const b = btn.getBoundingClientRect();
      const bx = b.left + b.width / 2;
      const by = b.top + b.height / 2;
      btn.classList.add("is-hole");
      playWhoosh();
      pulls.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
        const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
        gsap.to(el, {
          x: bx - cx,
          y: by - cy,
          scale: 0.04,
          rotation: (i % 2 ? 1 : -1) * gsap.utils.random(180, 540),
          duration: gsap.utils.random(0.7, 1.1),
          ease: "power3.in",
          overwrite: true,
        });
      });
    };
    const release = (btn: HTMLElement) => {
      btn.classList.remove("is-hole");
      pulls.forEach((el) =>
        gsap.to(el, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: gsap.utils.random(1.2, 1.8),
          ease: "elastic.out(1, 0.55)",
          overwrite: true,
        }),
      );
    };
    const offs = buttons.map((btn) => {
      const enter = () => suck(btn);
      const leave = () => release(btn);
      btn.addEventListener("pointerenter", enter);
      btn.addEventListener("pointerleave", leave);
      return () => {
        btn.removeEventListener("pointerenter", enter);
        btn.removeEventListener("pointerleave", leave);
      };
    });

    return () => {
      section.removeEventListener("pointermove", move);
      offs.forEach((off) => off());
    };
  }, []);

  return (
    <section className="contact" id="contacto" data-tone="dark" ref={root}>
      <div className="contact__bubbles" aria-hidden="true">
        {words.map((w) => (
          <span
            className="bubble"
            key={w.text}
            lang={w.lang}
            data-depth={w.depth}
            style={{ left: `${w.x}%`, top: `${w.y}%`, fontSize: `calc(${w.size}vw + 0.75rem)`, opacity: w.opacity }}
          >
            <span className="bubble__pull">
              <span className="bubble__inner" style={{ filter: `blur(${w.blur}px)` }}>
                {w.text}
              </span>
            </span>
          </span>
        ))}
      </div>

      <div className="contact__content">
        <SplitReveal text="Contacto" className="contact__title" effect="blur" />
        <p className="contact__text">
          ¿Tienes un proyecto en mente? Me encantaría escucharte.
          <br />
          Cuéntame qué necesitas y te respondo lo antes posible.
        </p>
        <div className="contact__actions">
          <Magnetic>
            <a className="pill pill--light" href={callUrl} target="_blank" rel="noopener noreferrer" data-scramble>
              Agenda una llamada
            </a>
          </Magnetic>
          <Magnetic>
            <a className="pill pill--blue" href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-scramble>
              Cotiza aquí
            </a>
          </Magnetic>
        </div>
        <a className="contact__phone muted" href={telUrl}>
          {site.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
