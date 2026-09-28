"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import * as THREE from "three";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

const TITLES = ".h2, .contact__title";
const PAD = 60; // margen para que las ondas puedan salirse del texto
const MAX_DROPS = 10;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Cada punto por donde pasa el cursor suelta una onda que se expande y se apaga
const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uText;
  uniform vec2 uSize;
  uniform float uTime;
  uniform float uAmp;
  uniform vec3 uDrops[${MAX_DROPS}];
  varying vec2 vUv;

  void main() {
    vec2 px = vUv * uSize;
    vec2 offset = vec2(0.0);
    for (int i = 0; i < ${MAX_DROPS}; i++) {
      vec3 d = uDrops[i];
      float age = uTime - d.z;
      if (d.z < 0.0 || age > 2.5) continue;
      vec2 dir = px - d.xy;
      float dist = length(dir);
      float ring = age * 260.0;
      float wave = sin((dist - ring) * 0.07) * exp(-abs(dist - ring) * 0.018) * exp(-age * 1.6);
      offset += normalize(dir + 0.0001) * wave * 16.0;
    }
    // Remolino suave y constante mientras el cursor está encima
    offset += vec2(sin(px.y * 0.03 + uTime * 3.0), cos(px.x * 0.025 + uTime * 2.4)) * 2.2;
    vec2 uv = vUv - offset * uAmp / uSize;
    gl_FragColor = texture2D(uText, uv);
  }
`;

type Active = {
  title: HTMLElement;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  size: THREE.Vector2;
  drops: THREE.Vector3[];
  amp: number;
  target: number;
  dropIndex: number;
  lastDrop: number;
};

function stretchKeyword(wdth: number) {
  if (wdth <= 78) return "condensed";
  if (wdth <= 94) return "semi-condensed";
  return "normal";
}

/** Dibuja el título tal cual en un canvas 2D (misma fuente, tamaño, espaciado y posición) */
function paintTitle(title: HTMLElement) {
  const rect = title.getBoundingClientRect();
  const cs = getComputedStyle(title);
  const dpr = Math.min(window.devicePixelRatio, 2);
  const w = rect.width + PAD * 2;
  const h = rect.height + PAD * 2;
  const c = document.createElement("canvas");
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  const wdth = Number(cs.fontVariationSettings.match(/"wdth"\s+([\d.]+)/)?.[1] ?? 100);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const c2 = ctx as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
  c2.fontStretch = stretchKeyword(wdth);
  c2.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  ctx.fillStyle = cs.color;
  ctx.textBaseline = "alphabetic";

  const m = ctx.measureText("Hg");
  const ascent = m.fontBoundingBoxAscent;
  const descent = m.fontBoundingBoxDescent;

  for (const inner of Array.from(title.querySelectorAll<HTMLElement>(".split__inner"))) {
    const r = inner.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(inner).lineHeight) || r.height;
    const baseline = r.top + (lh - (ascent + descent)) / 2 + ascent;
    const raw = inner.textContent ?? "";
    const text = cs.textTransform === "uppercase" ? raw.toUpperCase() : cs.textTransform === "lowercase" ? raw.toLowerCase() : raw;
    ctx.fillText(text, r.left - rect.left + PAD, baseline - rect.top + PAD);
  }
  return { canvas: c, w, h };
}

/** Títulos líquidos: al pasar el mouse se deforman como tinta en agua */
export default function LiquidTitles() {
  const pathname = usePathname();

  useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let mesh: THREE.Mesh | null = null;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    let active: Active | null = null;
    let raf = 0;
    const start = performance.now();

    const ensureRenderer = () => {
      if (renderer) return renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false });
      } catch {
        return null;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = "liquid";
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        uniforms: {
          uText: { value: null },
          uSize: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uAmp: { value: 0 },
          uDrops: { value: Array.from({ length: MAX_DROPS }, () => new THREE.Vector3(0, 0, -1)) },
        },
      });
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);
      return renderer;
    };

    const loop = () => {
      if (!active || !renderer || !material) return;
      const a = active;
      a.amp += (a.target - a.amp) * 0.08;
      const t = (performance.now() - start) / 1000;
      material.uniforms.uTime.value = t;
      material.uniforms.uAmp.value = a.amp;
      renderer.render(scene, camera);

      if (a.target === 0 && a.amp < 0.01) {
        // Vuelve el texto real
        a.title.classList.remove("is-liquid");
        a.canvas.remove();
        a.texture.dispose();
        active = null;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const activate = (title: HTMLElement) => {
      if (active?.title === title) {
        active.target = 1;
        return;
      }
      if (active) {
        active.title.classList.remove("is-liquid");
        active.canvas.remove();
        active.texture.dispose();
        active = null;
      }
      // Solo cuando el título ya terminó de aparecer
      const first = title.querySelector<HTMLElement>(".split__inner");
      if (!first || Number(getComputedStyle(first).opacity) < 0.98) return;

      const r = ensureRenderer();
      if (!r || !material) return;
      const painted = paintTitle(title);
      if (!painted) return;

      const texture = new THREE.CanvasTexture(painted.canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      material.uniforms.uText.value = texture;
      material.uniforms.uSize.value.set(painted.w, painted.h);
      (material.uniforms.uDrops.value as THREE.Vector3[]).forEach((d) => d.set(0, 0, -1));

      r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      r.setSize(painted.w, painted.h, false);
      const canvas = r.domElement;
      canvas.style.width = `${painted.w}px`;
      canvas.style.height = `${painted.h}px`;
      canvas.style.left = `${-PAD}px`;
      canvas.style.top = `${-PAD}px`;
      title.appendChild(canvas);

      active = {
        title,
        canvas,
        texture,
        size: material.uniforms.uSize.value,
        drops: material.uniforms.uDrops.value,
        amp: 0,
        target: 1,
        dropIndex: 0,
        lastDrop: 0,
      };
      r.render(scene, camera);
      title.classList.add("is-liquid");
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const over = (e: PointerEvent) => {
      const title = e.target instanceof Element ? e.target.closest<HTMLElement>(TITLES) : null;
      if (title) activate(title);
    };
    const out = (e: PointerEvent) => {
      if (!active) return;
      const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (to && active.title.contains(to)) return;
      if (e.target instanceof Node && active.title.contains(e.target)) active.target = 0;
    };
    const move = (e: PointerEvent) => {
      if (!active || active.target === 0) return;
      const r = active.canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = r.height - (e.clientY - r.top); // el shader cuenta desde abajo
      const now = (performance.now() - start) / 1000;
      if (now - active.lastDrop < 0.07) return;
      active.lastDrop = now;
      active.drops[active.dropIndex % MAX_DROPS].set(x, y, now);
      active.dropIndex++;
    };

    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    window.addEventListener("pointermove", move);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      window.removeEventListener("pointermove", move);
      if (active) {
        active.title.classList.remove("is-liquid");
        active.canvas.remove();
        active.texture.dispose();
      }
      mesh?.geometry.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  }, [pathname]);

  return null;
}
