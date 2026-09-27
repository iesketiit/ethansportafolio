"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

const GAP = 30;
const RADIUS = 170;

/** Malla de puntos que se aparta del cursor como un campo magnético. */
export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasFinePointer() && !prefersReducedMotion());
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!enabled || !canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Dot = { ox: number; oy: number; x: number; y: number };
    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    const mouse = { x: -9999, y: -9999, inside: false };
    let raf = 0;
    let running = false;
    let color = "0,0,0";

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) dots.push({ ox: x, oy: y, x, y });
      }
      draw(true);
    };

    const readColor = () => {
      const fg = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim();
      const m = fg.match(/^#?([0-9a-f]{6})$/i);
      if (m) {
        const n = parseInt(m[1], 16);
        color = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
      }
    };

    const draw = (once = false) => {
      ctx.clearRect(0, 0, w, h);
      let moving = false;
      for (const d of dots) {
        let tx = d.ox;
        let ty = d.oy;
        let k = 0;
        if (mouse.inside) {
          const dx = d.ox - mouse.x;
          const dy = d.oy - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS) {
            k = 1 - dist / RADIUS;
            const push = k * k * 42;
            tx += (dx / (dist || 1)) * push;
            ty += (dy / (dist || 1)) * push;
          }
        }
        d.x += (tx - d.x) * 0.16;
        d.y += (ty - d.y) * 0.16;
        if (Math.abs(tx - d.x) > 0.1 || Math.abs(ty - d.y) > 0.1) moving = true;
        const near = mouse.inside ? Math.max(0, 1 - Math.hypot(d.x - mouse.x, d.y - mouse.y) / RADIUS) : 0;
        ctx.fillStyle = near > 0.05 ? `rgba(44,70,177,${0.35 + near * 0.65})` : `rgba(${color},0.16)`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.3 + near * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (once) return;
      if (moving || mouse.inside) raf = requestAnimationFrame(() => draw());
      else running = false;
    };

    const start = () => {
      if (running) return;
      running = true;
      readColor();
      raf = requestAnimationFrame(() => draw());
    };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.inside = true;
      start();
    };
    const leave = () => {
      mouse.inside = false;
      start();
    };

    readColor();
    build();
    const ro = new ResizeObserver(build);
    ro.observe(host);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas className="dot-field" ref={ref} aria-hidden="true" />;
}
