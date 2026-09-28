"use client";

import { useEffect, useRef } from "react";
import { onIntroDone, prefersReducedMotion } from "@/lib/motion";
import { onWeather, refreshWeather, type WeatherKind } from "@/lib/tokyo";

type Drop = { x: number; y: number; len: number; speed: number; drift: number; size: number; phase: number };
type Splash = { x: number; y: number; t: number };

/** Lluvia, tormenta o nieve según el clima real de Tokio, sobre el fondo de tinta */
export default function WeatherLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  // Consulta el clima al cargar y cada 15 minutos
  useEffect(() => {
    void refreshWeather();
    const id = window.setInterval(() => void refreshWeather(), 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let kind: WeatherKind = "clear";
    let drops: Drop[] = [];
    let splashes: Splash[] = [];
    let raf = 0;
    let running = false;
    let flash = 0;
    let nextBolt = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (count: number, snow: boolean) => {
      drops = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: snow ? 0 : 12 + Math.random() * 18,
        speed: snow ? 0.4 + Math.random() * 1 : 11 + Math.random() * 9,
        drift: snow ? 0.3 + Math.random() * 0.6 : 2.2,
        size: snow ? 1 + Math.random() * 2.4 : 1,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const frame = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const rain = kind === "rain" || kind === "storm";

      if (rain) {
        ctx.strokeStyle = "rgba(200, 214, 245, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const d of drops) {
          d.y += d.speed;
          d.x += d.drift;
          if (d.y > h) {
            if (Math.random() < 0.35) splashes.push({ x: d.x, y: h - 2, t });
            d.y = -d.len;
            d.x = Math.random() * (w + 200) - 100;
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.drift * 1.6, d.y - d.len);
        }
        ctx.stroke();

        // Salpicaduras al tocar el suelo
        splashes = splashes.filter((s) => t - s.t < 400);
        for (const s of splashes) {
          const k = (t - s.t) / 400;
          ctx.strokeStyle = `rgba(200, 214, 245, ${0.4 * (1 - k)})`;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, 2 + k * 10, 1 + k * 2.5, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (kind === "snow") {
        ctx.fillStyle = "rgba(240, 244, 255, 0.8)";
        for (const d of drops) {
          d.y += d.speed;
          d.x += Math.sin(t / 1000 + d.phase) * d.drift;
          if (d.y > h + 5) {
            d.y = -5;
            d.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Relámpagos
      if (kind === "storm") {
        if (t > nextBolt) {
          flash = 1;
          nextBolt = t + 3500 + Math.random() * 6000;
          window.dispatchEvent(new Event("ethan:lightning"));
        }
        if (flash > 0.01) {
          ctx.fillStyle = `rgba(220, 230, 255, ${flash * 0.35})`;
          ctx.fillRect(0, 0, w, h);
          flash *= Math.random() < 0.15 ? 1.6 : 0.82; // parpadeo irregular
          flash = Math.min(flash, 1);
        }
      }

      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || kind === "clear" || kind === "clouds" || kind === "fog" || document.hidden) return;
      if (!window.__ethanIntroDone) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };

    const offWeather = onWeather((wth) => {
      stop();
      kind = wth.kind;
      if (kind === "rain") spawn(Math.round(w / 9), false);
      if (kind === "storm") spawn(Math.round(w / 5), false);
      if (kind === "snow") spawn(Math.round(w / 12), true);
      start();
    });
    const offIntro = onIntroDone(start);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);

    return () => {
      stop();
      offWeather();
      offIntro();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas className="weather" ref={ref} aria-hidden="true" />;
}
