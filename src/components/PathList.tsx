"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type Item = { place: string; detail: string; ghost: string };

/** Trayectoria: al pasar por cada etapa aparece de fondo una palabra gigante, como un recuerdo */
export default function PathList({ items }: { items: Item[] }) {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ul = list.current;
    const section = ul?.closest("section");
    // La palabra vive a nivel de la sección para quedar centrada detrás de todo
    const g = section?.querySelector<HTMLElement>(".ghost-word");
    if (!ul || !g || !hasFinePointer() || prefersReducedMotion()) return;

    const rows = Array.from(ul.querySelectorAll<HTMLElement>(".row"));
    gsap.set(g, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(g, "x", { duration: 1.2, ease: "power3" });
    const yTo = gsap.quickTo(g, "y", { duration: 1.2, ease: "power3" });

    const enter = (row: HTMLElement) => {
      g.textContent = row.dataset.ghost ?? "";
      gsap.fromTo(
        g,
        { opacity: 0, scale: 0.85, letterSpacing: "0.2em", filter: "blur(18px)" },
        { opacity: 0.16, scale: 1, letterSpacing: "-0.02em", filter: "blur(2px)", duration: 0.9, ease: "power3.out", overwrite: true },
      );
    };
    const leave = () => gsap.to(g, { opacity: 0, filter: "blur(18px)", duration: 0.6, overwrite: true });
    const move = (e: PointerEvent) => {
      if (!section) return;
      const r = section.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.15);
      yTo((e.clientY - r.top - r.height / 2) * 0.1);
    };

    const offs = rows.map((row) => {
      const on = () => enter(row);
      row.addEventListener("pointerenter", on);
      return () => row.removeEventListener("pointerenter", on);
    });
    ul.addEventListener("pointerleave", leave);
    ul.addEventListener("pointermove", move);
    return () => {
      offs.forEach((o) => o());
      ul.removeEventListener("pointerleave", leave);
      ul.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <ul className="rows" ref={list}>
        {items.map((item) => (
          <li className="row row--path" key={item.place + item.detail} data-ghost={item.ghost}>
            <strong>{item.place}</strong>
            <span className="muted">{item.detail}</span>
          </li>
        ))}
    </ul>
  );
}
