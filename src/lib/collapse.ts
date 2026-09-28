"use client";

import { gsap } from "./gsap";
import { playThud, playWhoosh } from "./sound";

const SELECTOR = [
  "h1",
  "h2",
  "h3",
  "p",
  ".pill",
  ".row",
  ".nav__logo",
  ".nav__links li",
  ".sound",
  ".proj__stage",
  ".tokyo-badge",
  ".hero__cue",
  ".signature",
  ".case__meta > div",
  ".browser",
].join(", ");

// Zonas que no participan: capas animadas todo el tiempo o fuera de la página
const EXCLUDE = ".preloader, .curtain, .menu-overlay, .contact__bubbles, .uv, .marquee, .neon-sign, .stamp";

type Item = { el: HTMLElement; body: Matter.Body; x0: number; y0: number };

let active = false;

function pickElements() {
  const h = window.innerHeight;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => {
    if (el.closest(EXCLUDE)) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6 || r.bottom < 0 || r.top > h) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "inline" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05;
  });
  // Si un elemento está dentro de otro elegido, cae junto con su contenedor
  return candidates.filter((el) => !candidates.some((other) => other !== el && other.contains(el))).slice(0, 70);
}

/** Todo lo que está en pantalla cae con física real, se amontona y luego vuelve a su lugar. */
export async function collapsePage(onDone?: () => void) {
  if (active) return;
  active = true;

  const Matter = (await import("matter-js")).default;
  const { Engine, Bodies, Body, Composite, Events } = Matter;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const lenis = window.__ethanLenis;
  lenis?.stop();
  document.documentElement.classList.add("is-collapsing");
  playWhoosh();

  const engine = Engine.create({ gravity: { x: 0, y: 1.15 } });
  const walls = [
    Bodies.rectangle(W / 2, H + 60, W * 3, 120, { isStatic: true }),
    Bodies.rectangle(-60, H / 2, 120, H * 6, { isStatic: true }),
    Bodies.rectangle(W + 60, H / 2, 120, H * 6, { isStatic: true }),
  ];

  const items: Item[] = pickElements().map((el) => {
    const r = el.getBoundingClientRect();
    const body = Bodies.rectangle(r.left + r.width / 2, r.top + r.height / 2, r.width, r.height, {
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.012,
      chamfer: { radius: Math.min(10, r.height / 3, r.width / 3) },
    });
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 7, y: -Math.random() * 7 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
    el.style.willChange = "translate, rotate";
    return { el, body, x0: body.position.x, y0: body.position.y };
  });

  Composite.add(engine.world, [...walls, ...items.map((i) => i.body)]);

  let lastThud = 0;
  Events.on(engine, "collisionStart", (e) => {
    const now = performance.now();
    if (now - lastThud < 70) return;
    const hit = e.pairs.find((p) => Math.abs(p.bodyA.velocity.y - p.bodyB.velocity.y) > 3);
    if (hit) {
      lastThud = now;
      playThud(Math.min(3, Math.abs(hit.bodyA.velocity.y - hit.bodyB.velocity.y) / 4));
    }
  });

  // Mientras están en el suelo, el cursor empuja los escombros
  const push = (e: PointerEvent) => {
    for (const it of items) {
      const dx = it.body.position.x - e.clientX;
      const dy = it.body.position.y - e.clientY;
      const d = Math.hypot(dx, dy);
      if (d < 140 && d > 0) {
        const f = (1 - d / 140) * 0.0025 * it.body.mass;
        Body.applyForce(it.body, it.body.position, { x: (dx / d) * f, y: (dy / d) * f - 0.0008 * it.body.mass });
      }
    }
  };
  window.addEventListener("pointermove", push);

  const render = () => {
    Engine.update(engine, 1000 / 60);
    for (const it of items) {
      it.el.style.translate = `${it.body.position.x - it.x0}px ${it.body.position.y - it.y0}px`;
      it.el.style.rotate = `${it.body.angle}rad`;
    }
  };
  gsap.ticker.add(render);

  await new Promise((r) => window.setTimeout(r, 5200));

  // Se reconstruye todo
  gsap.ticker.remove(render);
  window.removeEventListener("pointermove", push);
  playWhoosh();

  await Promise.all(
    items.map((it) => {
      const dx = it.body.position.x - it.x0;
      const dy = it.body.position.y - it.y0;
      const angle = it.body.angle;
      const proxy = { p: 1 };
      return new Promise<void>((resolve) => {
        gsap.to(proxy, {
          p: 0,
          duration: 1.4,
          delay: Math.random() * 0.5,
          ease: "elastic.out(1, 0.55)",
          onUpdate: () => {
            it.el.style.translate = `${dx * proxy.p}px ${dy * proxy.p}px`;
            it.el.style.rotate = `${angle * proxy.p}rad`;
          },
          onComplete: () => {
            it.el.style.translate = "";
            it.el.style.rotate = "";
            it.el.style.willChange = "";
            resolve();
          },
        });
      });
    }),
  );

  Engine.clear(engine);
  document.documentElement.classList.remove("is-collapsing");
  lenis?.start();
  active = false;
  onDone?.();
}
