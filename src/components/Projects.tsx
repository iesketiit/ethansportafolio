"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { playWhoosh } from "@/lib/sound";
import { domainOf, projects } from "@/data/projects";
import Marquee from "./Marquee";
import ProjectImage from "./ProjectImage";
import SplitReveal from "./SplitReveal";
import TransitionLink from "./TransitionLink";
import { PAGE_READY_EVENT, useNavigate } from "./TransitionProvider";

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

/** Reproduce el video del proyecto si existe (/proyectos/<slug>.mp4); si no, se queda la captura */
function playVideo(video: HTMLVideoElement | null) {
  if (!video || video.dataset.missing) return;
  video.play().catch(() => {});
}

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Clic en un proyecto: su captura crece hasta llenar la pantalla y se convierte en la portada del caso
  const expand = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || prefersReducedMotion()) return;
    const article = e.currentTarget.closest(".proj");
    const img = article?.querySelector<HTMLImageElement>(".mock--back .mock__view img");
    if (!img || !img.complete || !img.naturalWidth) return; // sin captura: transición normal
    e.preventDefault();

    const view = img.closest(".mock__view") ?? img;
    const r = view.getBoundingClientRect();
    const clone = document.createElement("div");
    clone.className = "expand";
    const pic = document.createElement("img");
    pic.src = img.currentSrc || img.src;
    pic.alt = "";
    clone.appendChild(pic);
    document.body.appendChild(clone);

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      gsap.to(clone, { opacity: 0, duration: 0.6, delay: 0.2, onComplete: () => clone.remove() });
    };
    window.addEventListener(PAGE_READY_EVENT, remove, { once: true });
    window.setTimeout(remove, 6000);

    playWhoosh();
    gsap.set(clone, { top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 8 });
    gsap.to(clone, {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      borderRadius: 0,
      duration: 0.95,
      ease: "power4.inOut",
      onComplete: () => navigate(href, { curtain: false }),
    });
  };

  // Proyectos apilados como cartas + parallax de las ventanas + recorte al entrar
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const panels = gsap.utils.toArray<HTMLElement>(".proj");

      // Escritorio: cada panel se queda fijo y el siguiente sube encima;
      // el de abajo se encoge y se oscurece
      const mm = gsap.matchMedia();
      mm.add("(min-width: 761px)", () => {
        panels.forEach((proj, i) => {
          const next = panels[i + 1];
          if (!next) return;
          ScrollTrigger.create({
            trigger: proj,
            start: "top top+=68",
            endTrigger: next,
            end: "top top+=68",
            pin: true,
            pinSpacing: false,
          });
          gsap.to(proj.querySelector(".proj__inner"), {
            scale: 0.9,
            borderRadius: 18,
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=68", scrub: true },
          });
          gsap.to(proj.querySelector(".proj__shade"), {
            opacity: 0.65,
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=68", scrub: true },
          });
        });
      });

      panels.forEach((proj) => {
        const scroll = { trigger: proj, start: "top bottom", end: "top top+=68", scrub: true };
        gsap.fromTo(proj.querySelector(".mock--back"), { yPercent: 14 }, { yPercent: -6, ease: "none", scrollTrigger: scroll });
        gsap.fromTo(proj.querySelector(".mock--front"), { yPercent: 40 }, { yPercent: -5, ease: "none", scrollTrigger: scroll });
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
      const video = stage.querySelector<HTMLVideoElement>(".mock__video");
      const enter = (e: PointerEvent) => {
        playVideo(video);
        const r = stage.getBoundingClientRect();
        if (lens) {
          gsap.set(lens, { x: e.clientX - r.left, y: e.clientY - r.top });
          gsap.to(lens, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" });
        }
      };
      const leave = () => {
        video?.pause();
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

  // Celular: el video se reproduce solo cuando el proyecto está en pantalla
  useEffect(() => {
    if (hasFinePointer() || prefersReducedMotion() || !root.current) return;
    const videos = Array.from(root.current.querySelectorAll<HTMLVideoElement>(".mock__video"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          const v = en.target as HTMLVideoElement;
          if (en.isIntersecting) playVideo(v);
          else v.pause();
        }),
      { threshold: 0.6 },
    );
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);

  return (
    <section className="work" id="trabajo" data-tone="dark" ref={root}>
      <div className="section__head work__head">
        <SplitReveal text={"Proyectos\nseleccionados"} className="h2" effect="blur" />
        <div className="section__aside">
          <p className="muted">{projects.length} sitios diseñados y desarrollados de principio a fin.</p>
          <TransitionLink href="/galeria" className="pill pill--blue work__gallery">
            Recorrer en 3D
          </TransitionLink>
        </div>
      </div>

      <div className="projs">
        {projects.map((p) => (
          <article className="proj" key={p.slug}>
            <div className="proj__inner">
            <div className="proj__info">
              <p className="proj__cat proj__reveal">{p.category}</p>
              <h3 className="proj__name proj__reveal">{p.name}</h3>
              <div className="proj__foot proj__reveal">
                <p>{p.summary}</p>
                <div className="proj__actions">
                  <a
                    className="pill pill--light"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visitar el sitio de ${p.name} (se abre en una pestaña nueva)`}
                  >
                    Visitar sitio
                  </a>
                  <TransitionLink
                    href={`/proyectos/${p.slug}`}
                    className="pill pill--outline"
                    onClick={(e) => expand(e, `/proyectos/${p.slug}`)}
                  >
                    Ver caso
                  </TransitionLink>
                </div>
              </div>
            </div>

            <TransitionLink
              href={`/proyectos/${p.slug}`}
              className="proj__stage"
              data-cursor="Ver"
              aria-label={`Ver el proyecto ${p.name}`}
              onClick={(e) => expand(e, `/proyectos/${p.slug}`)}
            >
              <div className="proj__mocks">
                <div className="mock mock--back">
                  <BrowserBar url={p.url} />
                  <div className="mock__view">
                    <ProjectImage project={p} variant="card" />
                    <video
                      className="mock__video"
                      src={`/proyectos/${p.slug}.mp4`}
                      muted
                      loop
                      playsInline
                      preload="none"
                      aria-hidden="true"
                      onPlaying={(e) => e.currentTarget.classList.add("is-playing")}
                      onError={(e) => {
                        e.currentTarget.dataset.missing = "1";
                      }}
                    />
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
            <span className="proj__shade" aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>

      <Marquee items={projects.map((p) => p.name)} trail={projects} />
    </section>
  );
}
