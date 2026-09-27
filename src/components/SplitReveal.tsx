"use client";

import { Fragment, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { onIntroDone, prefersReducedMotion } from "@/lib/motion";

type Props = {
  /** Usa \n para forzar saltos de línea */
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  trigger?: "scroll" | "intro";
  delay?: number;
};

export default function SplitReveal({ text, as = "h2", className = "", trigger = "scroll", delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as React.ElementType;

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const words = ref.current.querySelectorAll(".split__inner");
      gsap.set(words, { yPercent: 115 });

      const play = () =>
        gsap.to(words, { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.06, delay });

      if (trigger === "intro") return onIntroDone(play);

      ScrollTrigger.create({ trigger: ref.current, start: "top 88%", once: true, onEnter: play });
    },
    { scope: ref },
  );

  const lines = text.split("\n");

  return (
    <Tag ref={ref} className={`split ${className}`} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {line.split(" ").map((word, wi) => (
            <Fragment key={wi}>
              <span className="split__word" aria-hidden="true">
                <span className="split__inner">{word}</span>
              </span>{" "}
            </Fragment>
          ))}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </Tag>
  );
}
