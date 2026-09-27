"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { hasFinePointer } from "@/lib/motion";
import { projects } from "@/data/projects";
import ProjectImage from "./ProjectImage";
import SplitReveal from "./SplitReveal";
import TransitionLink from "./TransitionLink";

export default function Projects() {
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(hasFinePointer());
  }, []);

  // La vista previa sigue al cursor
  useEffect(() => {
    const el = preview.current;
    if (!fine || !el) return;
    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0.6, opacity: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [fine]);

  useEffect(() => {
    if (!fine || !preview.current) return;
    gsap.to(preview.current, {
      opacity: active >= 0 ? 1 : 0,
      scale: active >= 0 ? 1 : 0.6,
      duration: 0.5,
      ease: "power3.out",
    });
  }, [active, fine]);

  return (
    <section className="section" id="trabajo">
      <div className="section__head">
        <SplitReveal text={"Proyectos\nseleccionados"} className="h2" />
        <p className="muted section__aside">{projects.length} sitios diseñados y desarrollados de principio a fin.</p>
      </div>

      <ul className="work-list" onPointerLeave={() => setActive(-1)}>
        {projects.map((p, i) => (
          <li className="work-row" key={p.slug} onPointerEnter={() => setActive(i)}>
            <TransitionLink href={`/proyectos/${p.slug}`} data-cursor="Ver">
              <span className="work-row__name">{p.name}</span>
              <span className="work-row__cat">{p.category}</span>
              {!fine && (
                <span className="work-row__thumb">
                  <ProjectImage project={p} />
                </span>
              )}
            </TransitionLink>
          </li>
        ))}
      </ul>

      {fine && (
        <div className="work-preview" ref={preview} aria-hidden="true">
          {projects.map((p, i) => (
            <div className={`work-preview__item ${i === active ? "is-active" : ""}`} key={p.slug}>
              <ProjectImage project={p} eager />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
