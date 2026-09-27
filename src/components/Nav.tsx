"use client";

import { useEffect, useState } from "react";
import TransitionLink from "./TransitionLink";
import { site } from "@/data/site";

const links = [
  { href: "/#trabajo", label: "Proyectos" },
  { href: "/#sobre-mi", label: "Sobre mí" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="nav">
        <TransitionLink href="/" className="nav__logo" onClick={() => setOpen(false)}>
          {site.name}
        </TransitionLink>
        <nav aria-label="Principal">
          <ul className="nav__links">
            {links.map((l) => (
              <li key={l.href}>
                <TransitionLink href={l.href}>{l.label}</TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          className="nav__menu"
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </header>

      <div id="menu-movil" className={`menu-overlay ${open ? "is-open" : ""}`} inert={!open}>
        {links.map((l) => (
          <TransitionLink key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </TransitionLink>
        ))}
      </div>
    </>
  );
}
