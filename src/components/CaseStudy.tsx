"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { domainOf, type Project } from "@/data/projects";
import Magnetic from "./Magnetic";
import ProjectImage from "./ProjectImage";
import SplitReveal from "./SplitReveal";
import TransitionLink from "./TransitionLink";
import Footer from "./Footer";

export default function CaseStudy({ project, next }: { project: Project; next: Project }) {
  const frameWrap = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);

  // El sitio completo "se recorre" dentro de la ventana del navegador al hacer scroll
  useGSAP(
    () => {
      if (prefersReducedMotion() || !view.current) return;
      const viewport = view.current;
      gsap.to(".browser__page", {
        y: () => {
          const page = viewport.querySelector<HTMLElement>(".browser__page");
          return page ? -Math.max(0, page.offsetHeight - viewport.clientHeight) : 0;
        },
        ease: "none",
        scrollTrigger: {
          trigger: frameWrap.current,
          start: "top top",
          end: "+=220%",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: frameWrap },
  );

  return (
    <main className="case">
      <header className="case__head">
        <p className="case__cat muted">{project.category}</p>
        <SplitReveal as="h1" text={project.name} className="case__title" trigger="intro" />

        <dl className="case__meta">
          <div>
            <dt>Rol</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{project.category}</dd>
          </div>
          <div>
            <dt>Sitio</dt>
            <dd>
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="underline">
                {domainOf(project.url)}
              </a>
            </dd>
          </div>
        </dl>

        <p className="case__summary">{project.summary}</p>
      </header>

      <div className="case__frame-wrap" ref={frameWrap}>
        <div className="browser">
          <div className="browser__bar">
            <span className="browser__dot" />
            <span className="browser__dot" />
            <span className="browser__dot" />
            <span className="browser__url">{domainOf(project.url)}</span>
          </div>
          <div className="browser__view" ref={view}>
            <div className="browser__page">
              <ProjectImage project={project} variant="full" eager onLoad={() => ScrollTrigger.refresh()} />
            </div>
          </div>
        </div>
      </div>

      <div className="case__actions">
        <Magnetic>
          <a className="pill pill--blue" data-scramble href={project.url} target="_blank" rel="noopener noreferrer">
            Visitar sitio
          </a>
        </Magnetic>
        <TransitionLink href="/#trabajo" className="underline">
          Todos los proyectos
        </TransitionLink>
      </div>

      <TransitionLink href={`/proyectos/${next.slug}`} className="case__next" data-cursor="Siguiente">
        <span className="muted">Siguiente proyecto</span>
        <span className="case__next-name">{next.name}</span>
      </TransitionLink>

      <Footer />
    </main>
  );
}
