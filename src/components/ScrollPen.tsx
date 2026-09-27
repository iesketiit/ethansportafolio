"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

type Geometry = { w: number; h: number; d: string };

// Generador pseudoaleatorio con semilla: la línea siempre tiene la misma forma
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothPath(pts: [number, number][]) {
  const f = (n: number) => Math.round(n * 10) / 10;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Línea que serpentea de lado a lado con rizos, como una firma larguísima */
function buildPath(w: number, h: number, startY: number) {
  const rand = seeded(403);
  const pts: [number, number][] = [[w * 0.86, startY]];
  let y = startY;
  let side = 0;
  while (y < h - 320) {
    y += 240 + rand() * 200;
    side = 1 - side;
    const x = side ? w * (0.05 + rand() * 0.16) : w * (0.79 + rand() * 0.16);
    pts.push([x, y]);
    if (rand() < 0.5) {
      // Rizo
      const r = 30 + rand() * 38;
      const dir = side ? 1 : -1;
      for (let k = 1; k <= 6; k++) {
        const a = Math.PI / 2 + dir * k * ((Math.PI * 2) / 6);
        pts.push([x + r * Math.cos(a), y - r + r * Math.sin(a)]);
      }
    }
  }
  pts.push([w * 0.5, h - 160]);
  return smoothPath(pts);
}

/** La pluma de la intro sigue escribiendo: dibuja una línea por toda la página al hacer scroll. */
export default function ScrollPen() {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const pen = useRef<SVGGElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);

  // Construye la línea según el tamaño real de la página
  useEffect(() => {
    const main = svg.current?.parentElement;
    if (!main) return;
    let timer = 0;
    const measure = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const w = main.clientWidth;
        // Alto real del contenido (sin contar esta misma línea)
        const last = main.lastElementChild as HTMLElement | null;
        const h = last ? last.offsetTop + last.offsetHeight : main.scrollHeight;
        setGeo((prev) =>
          prev && Math.abs(prev.w - w) < 2 && Math.abs(prev.h - h) < 2
            ? prev
            : { w, h, d: buildPath(w, h, window.innerHeight * 0.92) },
        );
      }, 150);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  // Dibuja según el scroll, con inercia, y mueve la pluma a la punta
  useEffect(() => {
    const p = path.current;
    const g = pen.current;
    if (!geo || !p || !g) return;

    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len} ${len}`;

    if (prefersReducedMotion()) {
      p.style.strokeDashoffset = "0";
      g.style.opacity = "0";
      return;
    }

    // Tabla: largo del trazo -> altura máxima alcanzada (los rizos suben un poco)
    const samples: { l: number; y: number }[] = [];
    let maxY = -Infinity;
    for (let l = 0; l <= len; l += 6) {
      maxY = Math.max(maxY, p.getPointAtLength(l).y);
      samples.push({ l, y: maxY });
    }
    const lengthForY = (y: number) => {
      let lo = 0;
      let hi = samples.length - 1;
      if (y <= samples[0].y) return 0;
      if (y >= samples[hi].y) return len;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].y < y) lo = mid + 1;
        else hi = mid;
      }
      return samples[lo].l;
    };

    let head = lengthForY(window.scrollY + window.innerHeight * 0.62);
    let tilt = 0;
    let prevX = 0;

    const render = () => {
      p.style.strokeDashoffset = String(len - head);
      const pt = p.getPointAtLength(head);
      tilt += (gsap.utils.clamp(-14, 14, (pt.x - prevX) * 1.5) - tilt) * 0.2;
      prevX = pt.x;
      g.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${50 + tilt}) scale(2.4)`);
      g.style.opacity = head > 4 && head < len - 2 ? "1" : "0";
    };
    render();

    const tick = () => {
      const target = lengthForY(window.scrollY + window.innerHeight * 0.62);
      const diff = target - head;
      if (Math.abs(diff) < 0.4) return;
      head += diff * 0.075;
      render();
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [geo]);

  return (
    <svg
      ref={svg}
      className="scroll-pen"
      width={geo?.w ?? 0}
      height={geo?.h ?? 0}
      viewBox={geo ? `0 0 ${geo.w} ${geo.h}` : undefined}
      aria-hidden="true"
    >
      <path ref={path} className="scroll-pen__line" d={geo?.d ?? ""} />
      <g ref={pen} className="scroll-pen__pen" style={{ opacity: 0 }}>
        <path d="M0 0 L5.2 -1.7 L7.4 -1.7 L7.4 1.7 L5.2 1.7 Z" fill="#E9E6DF" />
        <path d="M0.7 0 L5.4 0" stroke="#2C46B1" strokeWidth="0.25" />
        <rect x="7.2" y="-2" width="6.2" height="4" rx="0.8" fill="#111" stroke="#E9E6DF" strokeWidth="0.2" />
        <rect x="13.2" y="-2.25" width="1.1" height="4.5" rx="0.3" fill="#E9E6DF" />
        <rect x="14.1" y="-2.3" width="22.5" height="4.6" rx="2.3" fill="#0A0A0A" stroke="#E9E6DF" strokeWidth="0.2" />
        <path d="M16 -1.35 L34.5 -1.35" stroke="rgba(255,255,255,0.28)" strokeWidth="0.4" strokeLinecap="round" />
        <rect x="30" y="-2.35" width="0.8" height="4.7" fill="#A9BDF2" />
      </g>
    </svg>
  );
}
