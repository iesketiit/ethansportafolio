"use client";

import { forwardRef } from "react";
import { signature } from "@/data/signature";

/** SVG de la firma. Se anima con drawSignature(). */
const Signature = forwardRef<SVGSVGElement, { className?: string }>(function Signature({ className = "" }, ref) {
  return (
    <svg ref={ref} className={`signature ${className}`} viewBox={signature.viewBox} role="img" aria-label="Firma de Ethan S">
      <g transform={signature.transform}>
        {signature.paths.map((d, i) => (
          <path key={i} d={d} pathLength={1} />
        ))}
      </g>
    </svg>
  );
});

export default Signature;
