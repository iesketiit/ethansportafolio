"use client";

import { useEffect, useState } from "react";
import TransitionLink from "./TransitionLink";
import SoundToggle from "./SoundToggle";
import { whatsappUrl } from "@/data/site";

const links = [
  { href: "/#trabajo", label: "Proyectos" },
  { href: "/#sobre-mi", label: "Sobre mí" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
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

      <div id="menu-movil" className={`menu-overlay ${open ? "is-open" : ""}`} inert={!open}>
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
