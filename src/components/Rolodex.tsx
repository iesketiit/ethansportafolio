"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/** Lista cuyas filas caen en 3D, una tras otra, como las tarjetas de un Rolodex. */
export default function Rolodex({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>(".row").forEach((row) => {
        gsap.fromTo(
          row,
          { rotationX: -88, opacity: 0, z: -120 },
          {
            rotationX: 0,
            opacity: 1,
            z: 0,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 98%", end: "top 62%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <ul className={`rows rows--3d ${className}`.trim()} ref={root}>
      {children}
    </ul>
  );
}
