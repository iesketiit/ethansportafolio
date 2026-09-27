"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { hasFinePointer } from "@/lib/motion";

type Mode = "default" | "link" | "view";

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasFinePointer());
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current || !label.current) return;
    const d = dot.current;
    const r = ring.current;
    const l = label.current;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 });
    const xDot = gsap.quickTo(d, "x", { duration: 0.1, ease: "power3" });
    const yDot = gsap.quickTo(d, "y", { duration: 0.1, ease: "power3" });
    const xRing = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const yRing = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

    let mode: Mode = "default";
    let shown = false;

    const setMode = (next: Mode, text = "") => {
      if (next === mode && l.textContent === text) return;
      mode = next;
      r.classList.toggle("is-view", next === "view");
      const size = next === "view" ? 96 : next === "link" ? 64 : 40;
      gsap.to(r, { width: size, height: size, duration: 0.45, ease: "power3.out" });
      gsap.to(d, { scale: next === "default" ? 1 : 0, duration: 0.3 });
      l.textContent = text;
      gsap.to(l, { opacity: next === "view" ? 1 : 0, duration: 0.3 });
    };

    let lastX = -1;
    let lastY = -1;

    const evaluate = (target: Element | null) => {
      const viewEl = target?.closest<HTMLElement>("[data-cursor]");
      if (viewEl) setMode("view", viewEl.dataset.cursor ?? "");
      else if (target?.closest("a, button")) setMode("link");
      else setMode("default");
    };

    // Al hacer scroll sin mover el mouse, lo que está debajo del cursor cambia
    const onScroll = () => {
      if (lastX < 0) return;
      evaluate(document.elementFromPoint(lastX, lastY));
    };

    const move = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!shown) {
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
        shown = true;
      }
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);

      evaluate(e.target instanceof Element ? e.target : null);
    };

    const hide = () => {
      gsap.to([d, r], { opacity: 0, duration: 0.3 });
      shown = false;
    };
    const down = () => gsap.to(r, { scale: 0.8, duration: 0.2 });
    const up = () => gsap.to(r, { scale: 1, duration: 0.4, ease: "back.out(3)" });

    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);

    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span className="cursor-ring__label" ref={label} />
      </div>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
