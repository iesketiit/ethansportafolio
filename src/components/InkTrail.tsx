"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type Point = { x: number; y: number; w: number; t: number };

const LIFE = 650; // ms que tarda en secarse la tinta

/** El cursor deja un trazo caligráfico: grueso si vas lento, fino si vas rápido. */
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
      if (points.length > 1) raf = requestAnimationFrame(draw);
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

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas className="ink-trail" ref={ref} aria-hidden="true" />;
}
