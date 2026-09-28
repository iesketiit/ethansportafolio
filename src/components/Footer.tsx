"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { drawSignature } from "@/lib/signature";
import { useNavigate } from "./TransitionProvider";
import Signature from "./Signature";
import DontTouch from "./DontTouch";
import { site, whatsappUrl } from "@/data/site";

export default function Footer() {
  const navigate = useNavigate();
  const root = useRef<HTMLElement>(null);
  const sig = useRef<SVGSVGElement>(null);

  // La firma vuelve a dibujarse al llegar al final de la página
  useGSAP(
    () => {
      if (!sig.current || prefersReducedMotion()) return;
      const tl = drawSignature(sig.current, { duration: 2.2 }).pause();
      ScrollTrigger.create({ trigger: root.current, start: "top 95%", once: true, onEnter: () => void tl.play() });
    },
    { scope: root },
  );

  return (
    <footer className="footer" ref={root} data-tone="dark">
      <Signature ref={sig} className="footer__sig" />
      <div className="footer__row">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <DontTouch />
        <button onClick={() => navigate(window.location.pathname)}>
          Volver arriba
        </button>
      </div>
    </footer>
  );
}
