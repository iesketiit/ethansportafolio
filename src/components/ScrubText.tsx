"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/** Párrafo que se "enciende" palabra por palabra al hacer scroll. */
export default function ScrubText({
  text,
  className = "",
  repel = false,
}: {
  text: string;
  className?: string;
  /** Las palabras se apartan del cursor */
  repel?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!repel || !el || !hasFinePointer() || prefersReducedMotion()) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".scrub__word"));
    const radius = 150;

    const move = (e: PointerEvent) => {
      for (const w of words) {
        const r = w.getBoundingClientRect();
        const cx = r.left + r.width / 2 - Number(gsap.getProperty(w, "x"));
        const cy = r.top + r.height / 2 - Number(gsap.getProperty(w, "y"));
        const dx = cx - e.clientX;
        const dy = cy - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        const force = Math.max(0, 1 - d / radius);
        gsap.to(w, {
          x: (dx / d) * force * 34,
          y: (dy / d) * force * 26,
          rotation: (dx / d) * force * 8,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };
    const leave = () =>
      gsap.to(words, { x: 0, y: 0, rotation: 0, duration: 1.2, ease: "elastic.out(1, 0.4)", overwrite: "auto" });

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [repel]);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const words = ref.current.querySelectorAll(".scrub__word");
      gsap.fromTo(
        words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 50%", scrub: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <p ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className="scrub__word">{w}</span>{" "}
        </Fragment>
      ))}
    </p>
  );
}
