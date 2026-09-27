"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { shotSources, type Project } from "@/data/projects";

/** Imagen con respaldo: si una captura falla, prueba la siguiente */
function trailImage(project: Project) {
  const img = document.createElement("img");
  const sources = shotSources(project, "card");
  let i = 0;
  img.alt = "";
  img.decoding = "async";
  img.onerror = () => {
    i++;
    if (i < sources.length) img.src = sources[i];
    else img.remove();
  };
  img.src = sources[0];
  return img;
}

/**
 * Cinta infinita que acelera y cambia de sentido según la velocidad del scroll.
 * Con trail: al pasar el mouse, van saliendo capturas de los proyectos detrás del cursor.
 */
export default function Marquee({ items, trail }: { items: string[]; trail?: Project[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!track.current || prefersReducedMotion()) return;
      const loop = gsap.to(track.current, { xPercent: -50, ease: "none", duration: 40, repeat: -1 });

      let direction = 1;
      let boost = 0;
      let speed = 1;

      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          direction = self.direction;
          boost = Math.min(Math.abs(self.getVelocity()) / 250, 8);
        },
      });

      const tick = () => {
        const target = direction * (1 + boost);
        speed += (target - speed) * 0.08;
        boost *= 0.92;
        loop.timeScale(speed);
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        st.kill();
      };
    },
    { scope: track },
  );

  // Rastro de capturas
  useEffect(() => {
    const el = root.current;
    if (!el || !trail?.length || !hasFinePointer() || prefersReducedMotion()) return;

    let lastX = 0;
    let lastY = 0;
    let index = 0;
    let first = true;
    const alive = new Set<HTMLElement>();

    const spawn = (x: number, y: number) => {
      const card = document.createElement("div");
      card.className = "trail-card";
      card.appendChild(trailImage(trail[index % trail.length]));
      index++;
      document.body.appendChild(card);
      alive.add(card);
      if (alive.size > 7) {
        const oldest = alive.values().next().value;
        if (oldest) {
          alive.delete(oldest);
          oldest.remove();
        }
      }
      gsap.set(card, { x, y, xPercent: -50, yPercent: -50, rotation: gsap.utils.random(-12, 12) });
      gsap
        .timeline({
          onComplete: () => {
            alive.delete(card);
            card.remove();
          },
        })
        .from(card, { scale: 0.4, opacity: 0, duration: 0.35, ease: "back.out(2)" })
        .to(card, { y: y + 70, scale: 0.8, opacity: 0, duration: 0.7, ease: "power2.in" }, "+=0.45");
    };

    const move = (e: PointerEvent) => {
      if (first) {
        lastX = e.clientX;
        lastY = e.clientY;
        first = false;
      }
      if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 95) return;
      lastX = e.clientX;
      lastY = e.clientY;
      spawn(e.clientX, e.clientY);
    };
    const leave = () => {
      first = true;
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      alive.forEach((c) => c.remove());
    };
  }, [trail]);

  const row = (key: string) => (
    <div className="marquee__row" key={key} aria-hidden={key === "b"}>
      {items.map((item, i) => (
        <span className="marquee__item" key={i}>
          {item}
          <span className="marquee__sep" />
        </span>
      ))}
    </div>
  );

  return (
    <div className={`marquee ${trail ? "marquee--trail" : ""}`} ref={root}>
      <div className="marquee__track" ref={track}>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
