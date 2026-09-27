"use client";

import { forwardRef, useId } from "react";
import { signature } from "@/data/signature";

type Props = { className?: string; withPen?: boolean };

/** Firma en SVG. Se anima con drawSignature(); withPen agrega la pluma que escribe. */
const Signature = forwardRef<SVGSVGElement, Props>(function Signature({ className = "", withPen = false }, ref) {
  const id = useId().replace(/:/g, "");
  const inkId = `ink-${id}`;
  const blurId = `blur-${id}`;

  return (
    <svg ref={ref} className={`signature ${className}`} viewBox={signature.viewBox} role="img" aria-label="Firma de Ethan S">
      <defs>
        {/* Bordes irregulares, como tinta sobre papel */}
        <filter id={inkId} filterUnits="userSpaceOnUse" x="-20" y="-20" width="190" height="90">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.45" />
        </filter>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>

      <g className="signature__ink" transform={signature.transform} filter={`url(#${inkId})`}>
        {signature.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {withPen && (
        <g className="pen" style={{ opacity: 0 }}>
          <g className="pen__shadow" filter={`url(#${blurId})`}>
            <rect x="0" y="-1.9" width="36" height="3.8" rx="1.9" fill="#000" />
          </g>
          <g className="pen__body">
            {/* Plumín */}
            <path d="M0 0 L5.2 -1.7 L7.4 -1.7 L7.4 1.7 L5.2 1.7 Z" fill="#E9E6DF" />
            <path d="M0.7 0 L5.4 0" stroke="#2C46B1" strokeWidth="0.25" />
            <circle cx="5" cy="0" r="0.35" fill="#2C46B1" />
            {/* Sección y anillo */}
            <rect x="7.2" y="-2" width="6.2" height="4" rx="0.8" fill="#111" />
            <rect x="13.2" y="-2.25" width="1.1" height="4.5" rx="0.3" fill="#E9E6DF" />
            {/* Cuerpo */}
            <rect x="14.1" y="-2.3" width="22.5" height="4.6" rx="2.3" fill="#0A0A0A" />
            <path d="M16 -1.35 L34.5 -1.35" stroke="rgba(255,255,255,0.28)" strokeWidth="0.4" strokeLinecap="round" />
            <rect x="30" y="-2.35" width="0.8" height="4.7" fill="#A9BDF2" />
          </g>
        </g>
      )}
    </svg>
  );
});

export default Signature;
