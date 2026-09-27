"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { domainOf, projects } from "@/data/projects";
import Marquee from "./Marquee";
import ProjectImage from "./ProjectImage";
import SplitReveal from "./SplitReveal";
import TransitionLink from "./TransitionLink";

function BrowserBar({ url }: { url: string }) {
  return (
    <div className="mock__bar">
      <span />
      <span />
      <span />
      <em>{domainOf(url)}</em>
    </div>
  );
}

export default function Projects() {
  const root = useRef<HTMLElement>(null);

  // Parallax de las ventanas + recorte al entrar + inclinación con el scroll
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>(".proj").forEach((proj) => {
        const scroll = { trigger: proj, start: "top bottom", end: "bottom top", scrub: true };
        gsap.fromTo(proj.querySelector(".mock--back"), { yPercent: 14 }, { yPercent: -10, ease: "none", scrollTrigger: scroll });
        gsap.fromTo(proj.querySelector(".mock--front"), { yPercent: 40 }, { yPercent: -25, ease: "none", scrollTrigger: scroll });
        gsap.fromTo(
          proj.querySelector(".proj__stage"),
          { clipPath: "inset(10% 6% 10% 6% round 12px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px)",
            ease: "none",
            scrollTrigger: { trigger: proj, start: "top bottom", end: "top 35%", scrub: true },
          },
        );
        gsap.from(proj.querySelectorAll(".proj__reveal"), {
          opacity: 0,
          y: 40,
          filter: "blur(8px)",
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: proj, start: "top 70%", once: true },
        });
      });
    },
    { scope: root },
  );

  // Las ventanas se inclinan en 3D siguiendo el cursor
  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion() || !root.current) return;
    const stages = Array.from(root.current.querySelectorAll<HTMLElement>(".proj__stage"));
    const cleanups = stages.map((stage) => {
      const mocks = stage.querySelector<HTMLElement>(".proj__mocks");
      if (!mocks) return () => {};
      const lens = stage.querySelector<HTMLElement>(".lens");
      const coords = stage.querySelector<HTMLElement>(".lens__coords");
      const rx = gsap.quickTo(mocks, "rotationX", { duration: 0.8, ease: "power3" });
      const ry = gsap.quickTo(mocks, "rotationY", { duration: 0.8, ease: "power3" });
      const lx = lens ? gsap.quickTo(lens, "x", { duration: 0.35, ease: "power3" }) : null;
      const ly = lens ? gsap.quickTo(lens, "y", { duration: 0.35, ease: "power3" }) : null;

      const move = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        ry((px / r.width - 0.5) * 12);
        rx(-(py / r.height - 0.5) * 9);
        lx?.(px);
        ly?.(py);
        if (coords) coords.textContent = `x ${Math.round(px)}  y ${Math.round(py)}`;
      };
      const enter = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        if (lens) {
          gsap.set(lens, { x: e.clientX - r.left, y: e.clientY - r.top });
          gsap.to(lens, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" });
        }
      };
      const leave = () => {
        rx(0);
        ry(0);
        if (lens) gsap.to(lens, { scale: 0.3, opacity: 0, duration: 0.35, ease: "power2.in" });
      };
      stage.addEventListener("pointerenter", enter);
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerleave", leave);
      return () => {
        stage.removeEventListener("pointerenter", enter);
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", leave);
      };
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section className="work" id="trabajo" data-tone="dark" ref={root}>
      <div className="section__head work__head">
        <SplitReveal text={"Proyectos\nseleccionados"} className="h2" effect="blur" />
        <p className="muted section__aside">{projects.length} sitios diseñados y desarrollados de principio a fin.</p>
      </div>

      <div className="projs">
        {projects.map((p) => (
          <article className="proj" key={p.slug}>
            <div className="proj__info">
              <p className="proj__cat proj__reveal">{p.category}</p>
              <h3 className="proj__name proj__reveal">{p.name}</h3>
              <div className="proj__foot proj__reveal">
                <p>{p.summary}</p>
                <TransitionLink href={`/proyectos/${p.slug}`} className="pill pill--light" data-scramble>
                  Ver proyecto
                </TransitionLink>
              </div>
            </div>

            <TransitionLink
              href={`/proyectos/${p.slug}`}
              className="proj__stage"
              data-cursor="Ver"
              aria-label={`Ver el proyecto ${p.name}`}
            >
              <div className="proj__mocks">
                <div className="mock mock--back">
                  <BrowserBar url={p.url} />
                  <div className="mock__view">
                    <ProjectImage project={p} variant="card" />
                  </div>
                </div>
                <div className="mock mock--front">
                  <BrowserBar url={p.url} />
                  <div className="mock__view">
                    <ProjectImage project={p} variant="mid" />
                  </div>
                </div>
              </div>
              {/* Lente "modo código": revela el sitio en negativo, como plano */}
              <span className="lens" aria-hidden="true">
                <span className="lens__coords" />
              </span>
            </TransitionLink>
          </article>
        ))}
      </div>

      <Marquee items={projects.map((p) => p.name)} />
    </section>
  );
}
