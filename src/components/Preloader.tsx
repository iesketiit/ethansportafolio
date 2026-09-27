"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone, prefersReducedMotion } from "@/lib/motion";
import { drawSignature } from "@/lib/signature";
import Signature from "./Signature";

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
    /* sin almacenamiento */
  }
}

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const sig = useRef<SVGSVGElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useGSAP(
    () => {
      if (readSeen() || prefersReducedMotion() || !sig.current) {
        setVisible(false);
        markIntroDone();
        return;
      }

      const html = document.documentElement;
      html.classList.add("is-loading");

      // Se avisa fuera del contexto de GSAP: si no, las animaciones del hero
      // quedarían dentro de este contexto y se revertirían al desmontar el preloader.
      const releaseIntro = () => window.setTimeout(markIntroDone, 0);

      const draw = drawSignature(sig.current, 2.8);
      const progress = { v: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          writeSeen();
          html.classList.remove("is-loading");
          setVisible(false);
        },
      });

      tl.add(draw, 0.2)
        .to(
          progress,
          {
            v: 100,
            duration: draw.duration(),
            ease: "none",
            onUpdate: () => {
              if (count.current) count.current.textContent = String(Math.round(progress.v)).padStart(3, "0");
            },
          },
          0.2,
        )
        .to(sig.current, { scale: 0.92, opacity: 0, filter: "blur(10px)", duration: 0.7, ease: "power3.in" }, "+=0.35")
        .to(".preloader__foot", { opacity: 0, duration: 0.4 }, "<")
        .to(
          root.current,
          { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "power4.inOut", onStart: releaseIntro },
          "-=0.25",
        );

      return () => html.classList.remove("is-loading");
    },
    { scope: root },
  );

  if (!visible) return null;

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <Signature ref={sig} className="preloader__sig" />
      <div className="preloader__foot">
        <span>Desarrollo web</span>
        <span className="preloader__count" ref={count}>
          000
        </span>
      </div>
    </div>
  );
}
