"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type Point = { x: number; y: number; w: number; t: number };
type Drop = { x: number; y: number; vx: number; vy: number; r: number; t: number; life: number };

const LIFE = 650; // ms que tarda en secarse la tinta

/**
 * El cursor deja un trazo caligráfico: grueso si vas lento, fino si vas rápido.
 * Cada clic salpica tinta.
 */
export default function InkTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasFinePointer() && !prefersReducedMotion());
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!enabled || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let points: Point[] = [];
    let drops: Drop[] = [];
    let raf = 0;
    let running = false;
    let lastWidth = 4;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      const now = performance.now();
      points = points.filter((p) => now - p.t < LIFE);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const life = 1 - (now - b.t) / LIFE;
        ctx.strokeStyle = `rgba(255, 255, 255, ${life * 0.9})`;
        ctx.lineWidth = b.w * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      drops = drops.filter((d) => now - d.t < d.life);
      for (const d of drops) {
        const life = 1 - (now - d.t) / d.life;
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.88;
        d.vy = d.vy * 0.88 + 0.12;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, life * 1.4)})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * (0.4 + life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      if (points.length > 1 || drops.length) raf = requestAnimationFrame(draw);
      else {
        running = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const move = (e: PointerEvent) => {
      const last = points[points.length - 1];
      const now = performance.now();
      let width = 4;
      if (last) {
        const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(1, now - last.t);
        width = Math.max(0.8, Math.min(7, 7 - speed * 2.2));
      }
      lastWidth += (width - lastWidth) * 0.35;
      points.push({ x: e.clientX, y: e.clientY, w: lastWidth, t: now });
      if (!running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    const splat = (e: PointerEvent) => {
      const now = performance.now();
      drops.push({ x: e.clientX, y: e.clientY, vx: 0, vy: 0, r: 12, t: now, life: 750 });
      const n = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 9;
        drops.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          r: 1.2 + Math.random() * 3.8,
          t: now,
          life: 700 + Math.random() * 600,
        });
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", splat, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", splat);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas className="ink-trail" ref={ref} aria-hidden="true" />;
}
