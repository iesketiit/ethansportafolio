"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone, prefersReducedMotion } from "@/lib/motion";
import { site } from "@/data/site";

const SEEN_KEY = "ethan:seen";

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useGSAP(
    () => {
      if (readSeen() || prefersReducedMotion()) {
        setVisible(false);
        markIntroDone();
        return;
      }

      const html = document.documentElement;
      html.classList.add("is-loading");
      const progress = { v: 0 };
      // Se avisa fuera del contexto de GSAP: si no, las animaciones del hero
      // quedarían dentro de este contexto y se revertirían al desmontar el preloader.
      const releaseIntro = () => window.setTimeout(markIntroDone, 0);

      const tl = gsap.timeline({
        onComplete: () => {
          writeSeen();
          html.classList.remove("is-loading");
          setVisible(false);
        },
      });

      tl.from(".preloader__letter", { yPercent: 110, stagger: 0.06, duration: 1, ease: "power4.out" })
        .to(
          progress,
          {
            v: 100,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
              if (count.current) count.current.textContent = String(Math.round(progress.v)).padStart(3, "0");
            },
          },
          0,
        )
        .to(".preloader__bar", { scaleX: 1, duration: 2, ease: "power2.inOut" }, 0)
        .to(".preloader__letter", { yPercent: -110, stagger: 0.04, duration: 0.6, ease: "power3.in" }, "+=0.15")
        .to(".preloader__foot", { opacity: 0, duration: 0.4 }, "<")
        .to(root.current, { yPercent: -100, duration: 1.1, ease: "power4.inOut", onStart: releaseIntro }, "-=0.2");

      return () => html.classList.remove("is-loading");
    },
    { scope: root },
  );

  if (!visible) return null;

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="preloader__name">
        {Array.from(site.name).map((ch, i) => (
          <span className="preloader__letter" key={i}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>
      <div className="preloader__foot">
        <span>Desarrollo web</span>
        <span className="preloader__count" ref={count}>
          000
        </span>
      </div>
      <div className="preloader__bar" />
    </div>
  );
}
