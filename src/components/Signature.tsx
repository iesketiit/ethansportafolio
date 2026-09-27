"use client";

import { forwardRef } from "react";
import { signature } from "@/data/signature";
import Pen from "./Pen";

type Props = { className?: string; withPen?: boolean };

/** Firma en SVG. Se anima con drawSignature(); withPen agrega la pluma que escribe. */
const Signature = forwardRef<SVGSVGElement, Props>(function Signature({ className = "", withPen = false }, ref) {
  return (
    <svg ref={ref} className={`signature ${className}`} viewBox={signature.viewBox} role="img" aria-label="Firma de Ethan S">
      <g className="signature__ink" transform={signature.transform}>
        {signature.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {withPen && <Pen />}
    </svg>
  );
});

export default Signature;
