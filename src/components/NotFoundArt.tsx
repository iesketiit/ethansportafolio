"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { onIntroDone, prefersReducedMotion } from "@/lib/motion";
import { drawSignature } from "@/lib/signature";
import { notFoundArt } from "@/data/notFound";
import Pen from "./Pen";

/** La pluma tacha el 404 y escribe a mano "Esta página no existe". */
export default function NotFoundArt() {
  const svg = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!svg.current) return;
      if (prefersReducedMotion()) {
        gsap.set(".signature__ink path", { strokeDashoffset: 0 });
        return;
      }
      const target = svg.current;
      gsap.set(".notfound__num", { opacity: 0, y: 30 });
      const tl = gsap
        .timeline({ paused: true, delay: 0.3 })
        .to(".notfound__num", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" })
        .add(drawSignature(target, { duration: 4.2 }), "+=0.2");
      // Si se llega directo a la 404, espera a que termine la intro de la firma
      return onIntroDone(() => void tl.play());
    },
    { scope: svg },
  );

  return (
    <svg ref={svg} className="signature notfound__art" viewBox={notFoundArt.viewBox} role="img" aria-label="404: esta página no existe">
      <text className="notfound__num" x="142" y="96" textAnchor="middle">
        404
      </text>
      <g className="signature__ink">
        {notFoundArt.paths.map((d, i) => (
          <path key={i} d={d} className={i === 0 ? "notfound__strike" : undefined} />
        ))}
      </g>
      <Pen />
    </svg>
  );
}
