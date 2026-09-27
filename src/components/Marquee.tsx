"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/** Cinta infinita que acelera y cambia de sentido según la velocidad del scroll. */
export default function Marquee({ items }: { items: string[] }) {
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
    <div className="marquee">
      <div className="marquee__track" ref={track}>
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
