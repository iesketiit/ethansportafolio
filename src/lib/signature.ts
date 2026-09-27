"use client";

import { gsap } from "./gsap";

/**
 * Devuelve un timeline que dibuja la firma trazo por trazo.
 * La duración de cada trazo es proporcional a su longitud real.
 */
export function drawSignature(svg: SVGSVGElement, totalDuration = 2.6) {
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
  const lengths = paths.map((p) => p.getTotalLength());
  const total = lengths.reduce((a, b) => a + b, 0) || 1;

  // pathLength=1 normaliza el trazo: dasharray 1 y offset 1 = oculto
  gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });

  const tl = gsap.timeline();
  paths.forEach((p, i) => {
    tl.to(p, {
      strokeDashoffset: 0,
      duration: Math.max(0.12, (lengths[i] / total) * totalDuration),
      ease: i === paths.length - 1 ? "power2.inOut" : "none",
    });
  });
  return tl;
}
