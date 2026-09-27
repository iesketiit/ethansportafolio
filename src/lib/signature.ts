"use client";

import { gsap } from "./gsap";
import { signature } from "@/data/signature";

const PEN_ANGLE = 52; // grados: la pluma apunta hacia abajo a la derecha, como en una mano diestra

type Options = {
  /** Duración total del trazo (sin contar pausas de la pluma) */
  duration?: number;
};

/**
 * Timeline que firma trazo por trazo.
 * Si el SVG tiene una pluma (.pen), su punta sigue el trazo: acelera y frena,
 * se inclina según la dirección y se levanta entre trazos.
 */
export function drawSignature(svg: SVGSVGElement, { duration = 3 }: Options = {}) {
  const ink = svg.querySelector<SVGGElement>(".signature__ink");
  const paths = Array.from(svg.querySelectorAll<SVGPathElement>(".signature__ink path"));
  const pen = svg.querySelector<SVGGElement>(".pen");
  const body = pen?.querySelector<SVGGElement>(".pen__body") ?? null;
  const shadow = pen?.querySelector<SVGGElement>(".pen__shadow") ?? null;

  const lengths = paths.map((p) => p.getTotalLength());
  const total = lengths.reduce((a, b) => a + b, 0) || 1;

  paths.forEach((p, i) => {
    p.style.strokeDasharray = `${lengths[i]} ${lengths[i]}`;
    p.style.strokeDashoffset = `${lengths[i]}`;
  });

  // Convierte un punto del trazo (espacio inclinado) al espacio del SVG
  const matrix = ink?.transform.baseVal.consolidate()?.matrix ?? null;
  const toSvg = (pt: DOMPoint) => (matrix ? pt.matrixTransform(matrix) : pt);

  const state = { x: 0, y: 0, lift: 10, tilt: 0 };
  const render = () => {
    if (!pen || !body || !shadow) return;
    const angle = PEN_ANGLE + state.tilt;
    pen.setAttribute("transform", `translate(${state.x} ${state.y})`);
    body.setAttribute("transform", `translate(${-state.lift * 0.35} ${-state.lift}) rotate(${angle})`);
    shadow.setAttribute("transform", `translate(${state.lift * 1.2} ${state.lift * 0.9 + 0.6}) rotate(${angle})`);
    shadow.style.opacity = String(Math.max(0.06, 0.32 - state.lift * 0.025));
  };

  const tl = gsap.timeline();
  let prevEnd: DOMPoint | null = null;

  paths.forEach((path, i) => {
    const len = lengths[i];
    const start = toSvg(path.getPointAtLength(0));

    if (pen) {
      if (!prevEnd) {
        // La pluma entra desde abajo a la derecha y se apoya en el papel
        tl.set(state, { x: start.x + 34, y: start.y + 26, lift: 12 })
          .call(render)
          .to(pen, { opacity: 1, duration: 0.3 })
          .to(state, { x: start.x, y: start.y, lift: 0, duration: 0.75, ease: "power3.out", onUpdate: render }, "<");
      } else {
        // Se levanta, viaja por el aire y vuelve a apoyarse
        const dist = Math.hypot(start.x - prevEnd.x, start.y - prevEnd.y);
        tl.to(state, { lift: 3.5, duration: 0.1, ease: "power2.out", onUpdate: render })
          .to(state, { x: start.x, y: start.y, duration: Math.min(0.45, 0.1 + dist / 260), ease: "power2.inOut", onUpdate: render }, "<0.03")
          .to(state, { lift: 0, duration: 0.08, ease: "power2.in", onUpdate: render }, ">-0.06");
      }
    }

    const progress = { v: 0 };
    const isFlourish = i === paths.length - 1;
    tl.to(progress, {
      v: 1,
      duration: Math.max(0.14, (len / total) * duration),
      // Una mano real acelera al inicio del trazo y frena al final; la rúbrica sale disparada
      ease: isFlourish ? "power2.in" : "sine.inOut",
      onUpdate: () => {
        const drawn = len * progress.v;
        path.style.strokeDashoffset = String(len - drawn);
        if (!pen) return;
        const pt = toSvg(path.getPointAtLength(drawn));
        const dx = pt.x - state.x;
        state.x = pt.x;
        state.y = pt.y;
        state.tilt += (gsap.utils.clamp(-9, 9, dx * 5) - state.tilt) * 0.25;
        render();
      },
    });

    prevEnd = toSvg(path.getPointAtLength(len));
  });

  if (pen) {
    // Termina: la pluma se levanta y sale de escena
    tl.to(state, {
      lift: 14,
      x: () => state.x + 26,
      y: () => state.y + 18,
      tilt: 0,
      duration: 0.8,
      ease: "power2.in",
      onUpdate: render,
    }).to(pen, { opacity: 0, duration: 0.45 }, "<0.35");
  }

  return tl;
}

/** Crea una firma suelta (sin React), para los sellos de doble clic. */
export function createSignatureSvg() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", signature.viewBox);
  svg.setAttribute("class", "signature");
  svg.setAttribute("aria-hidden", "true");
  const g = document.createElementNS(ns, "g");
  g.setAttribute("class", "signature__ink");
  g.setAttribute("transform", signature.transform);
  signature.paths.forEach((d) => {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    g.appendChild(p);
  });
  svg.appendChild(g);
  return svg;
}
