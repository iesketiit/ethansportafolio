"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import TransitionLink from "./TransitionLink";
import SoundToggle from "./SoundToggle";
import { whatsappUrl } from "@/data/site";

const links = [
  { href: "/#trabajo", label: "Proyectos" },
  { href: "/#sobre-mi", label: "Sobre mí" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#contacto", label: "Contacto" },
];

/** Contorno de mancha de tinta: un círculo con bordes ondulados que se mueven */
function blobPath(cx: number, cy: number, r: number, phase: number) {
  const n = 48;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 1 + 0.09 * Math.sin(a * 3 + phase) + 0.06 * Math.sin(a * 7 - phase * 1.7) + 0.035 * Math.sin(a * 13 + phase * 2.3);
    const x = cx + Math.cos(a) * r * wobble;
    const y = cy + Math.sin(a) * r * wobble;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `path("${d}Z")`;
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const firstRun = useRef(true);

  // Menú móvil: una mancha de tinta se derrama desde el botón y cubre la pantalla
  useEffect(() => {
    const el = overlay.current;
    const btn = menuBtn.current;
    if (!el) return;
    const links = el.querySelectorAll<HTMLElement>("a");

    if (firstRun.current) {
      firstRun.current = false;
      el.style.clipPath = "circle(0px at 100% 0%)";
      return;
    }

    const b = btn?.getBoundingClientRect();
    const cx = b ? b.left + b.width / 2 : window.innerWidth - 40;
    const cy = b ? b.top + b.height / 2 : 32;
    const maxR = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) * 1.14;

    if (prefersReducedMotion()) {
      el.style.clipPath = open ? "none" : "circle(0px at 100% 0%)";
      return;
    }

    const state = { r: open ? 0 : maxR, phase: 0 };
    const tl = gsap.timeline();
    tl.to(state, {
      r: open ? maxR : 0,
      phase: open ? 6 : -6,
      duration: open ? 1.25 : 0.75,
      ease: open ? "power2.inOut" : "power3.in",
      onUpdate: () => {
        el.style.clipPath = blobPath(cx, cy, state.r, state.phase);
      },
      onComplete: () => {
        el.style.clipPath = open ? "none" : "circle(0px at 100% 0%)";
      },
    });
    if (open) {
      tl.fromTo(
        links,
        { yPercent: 60, opacity: 0, rotation: 4 },
        { yPercent: 0, opacity: 1, rotation: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 },
        0.35,
      );
    }
    return () => {
      tl.kill();
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={`nav ${scrolled ? "is-scrolled" : ""} ${open ? "is-menu-open" : ""}`}>
        <TransitionLink href="/" className="nav__logo" data-scramble onClick={() => setOpen(false)}>
          Ethan [S]
        </TransitionLink>

        <nav aria-label="Principal">
          <ul className="nav__links">
            {links.map((l) => (
              <li key={l.href}>
                <TransitionLink href={l.href} data-scramble>
                  {l.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__actions">
          <SoundToggle />
          <a className="pill pill--blue nav__cta" href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-scramble>
            Cotiza aquí
          </a>
          <button
            className="nav__menu"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
      </header>

      <div id="menu-movil" ref={overlay} className={`menu-overlay ${open ? "is-open" : ""}`} inert={!open}>
        {links.map((l) => (
          <TransitionLink key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </TransitionLink>
        ))}
        <a className="pill pill--blue menu-overlay__cta" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          Cotiza aquí
        </a>
      </div>
    </>
  );
}
