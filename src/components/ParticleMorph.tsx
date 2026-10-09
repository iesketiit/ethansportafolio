"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/motion";
import { site } from "@/data/site";

// Capítulos: cada uno corresponde a una forma de las partículas
const chapters = [
  { jp: "種", title: "Todo empieza con una idea.", text: "Una esfera de puntos sueltos: lo que quieres contar." },
  { jp: "形", title: "Se tuerce, se prueba, se rompe.", text: "Bocetos, pruebas y versiones hasta encontrar la forma." },
  { jp: "名", title: "Hasta que tiene nombre.", text: "Una marca con identidad propia, lista para mostrarse." },
  { jp: "宇宙", title: "Y entonces se vuelve universo.", text: "Un sitio vivo que crece contigo. Sigue bajando." },
];

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixel;
  uniform float uPush;
  uniform float uDive;
  uniform float uCamZ;
  uniform vec3 uMouse;
  attribute vec3 aS1;
  attribute vec3 aS2;
  attribute vec3 aS3;
  attribute vec4 aRnd;
  varying float vAlpha;
  varying float vTone;
  varying vec2 vDir;
  varying float vStretch;

  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }
  vec3 rotX(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
  }
  // Cada partícula cambia de forma con su propio retraso
  float seg(float i) {
    return smoothstep(0.0, 1.0, clamp((uMorph - i) * 1.5 - aRnd.x * 0.5, 0.0, 1.0));
  }

  void main() {
    float t1 = seg(0.0);
    float t2 = seg(1.0);
    float t3 = seg(2.0);

    vec3 sphere = rotY(position, uTime * 0.12);
    vec3 galaxy = rotX(rotY(aS3, uTime * 0.07), 0.55);

    vec3 p = mix(sphere, aS1, t1);
    p = mix(p, aS2, t2);
    p = mix(p, galaxy, t3);

    // A mitad de cada cambio, las partículas se arremolinan
    float turb = sin(t1 * 3.14159) + sin(t2 * 3.14159) + sin(t3 * 3.14159);
    p = rotY(p, turb * (aRnd.y - 0.5) * 2.8);
    p += vec3(
      sin(uTime * 0.7 + aRnd.y * 40.0),
      cos(uTime * 0.6 + aRnd.z * 40.0),
      sin(uTime * 0.5 + aRnd.w * 40.0)
    ) * (0.025 + turb * 0.7 * aRnd.z);

    // Final: las partículas forman un túnel de hiperespacio que pasa junto a la cámara
    float ang = aRnd.y * 6.28318;
    float rad = 1.1 + aRnd.z * 5.5;
    float tz = mod(aRnd.x * 80.0 + uTime * 32.0, 80.0) - 75.0 + uCamZ;
    vec3 tunnel = vec3(cos(ang) * rad, sin(ang) * rad, tz);
    p = mix(p, tunnel, smoothstep(0.0, 1.0, uDive * 1.4 - aRnd.w * 0.4));

    // El cursor empuja las partículas como un imán
    vec3 d = p - uMouse;
    float f = exp(-dot(d, d) * 2.2) * uPush;
    p += normalize(d + vec3(0.0001)) * f * 0.9;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // El nombre usa puntos más finos para que se lea mejor
    float size = uSize * (0.35 + aRnd.z * 0.9) * (1.0 + f * 1.6) * (1.0 - 0.3 * t2 * (1.0 - t3));
    size *= 1.0 + uDive * 2.5;
    gl_PointSize = size * uPixel / max(0.2, -mv.z);
    // En el salto, cada punto se estira hacia afuera desde el centro de la pantalla
    vec2 sp = gl_Position.xy / max(0.001, gl_Position.w);
    vDir = normalize(sp + vec2(0.0001));
    vStretch = uDive;
    vAlpha *= 1.0 + uDive * 1.2;
    vAlpha = (0.75 + 0.25 * sin(uTime * 2.0 + aRnd.w * 30.0)) * smoothstep(0.15, 1.6, -mv.z);
    vTone = clamp(aRnd.w * aRnd.w + f * 0.8, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTone;
  varying vec2 vDir;
  varying float vStretch;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    c.y = -c.y;
    float along = dot(c, vDir);
    float across = dot(c, vec2(-vDir.y, vDir.x));
    float d = length(vec2(along, across * (1.0 + vStretch * 7.0)));
    float a = smoothstep(0.5, 0.0, d);
    a *= a * vAlpha * uOpacity;
    vec3 col = vTone < 0.6 ? mix(uC1, uC2, vTone / 0.6) : mix(uC2, uC3, (vTone - 0.6) / 0.4);
    gl_FragColor = vec4(col * a, a);
  }
`;

const rand = () => Math.random();
const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

function sphereShape(n: number) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const shell = rand() < 0.85;
    const r = shell ? 2.6 + gauss() * 0.05 : 2.4 * Math.cbrt(rand());
    const y = 1 - (i / (n - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const a = golden * i;
    out[i * 3] = Math.cos(a) * ring * r;
    out[i * 3 + 1] = y * r;
    out[i * 3 + 2] = Math.sin(a) * ring * r;
  }
  return out;
}

function knotShape(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = rand() * Math.PI * 2;
    const R = 2 + 0.8 * Math.cos(3 * t);
    const tube = 0.3 * Math.sqrt(rand());
    const ta = rand() * Math.PI * 2;
    out[i * 3] = R * Math.cos(2 * t) + Math.cos(ta) * tube;
    out[i * 3 + 1] = R * Math.sin(2 * t) + Math.sin(ta) * tube;
    out[i * 3 + 2] = 0.8 * Math.sin(3 * t) * 1.4 + gauss() * tube;
  }
  return out;
}

function galaxyShape(n: number) {
  const out = new Float32Array(n * 3);
  const arms = 3;
  for (let i = 0; i < n; i++) {
    const r = Math.pow(rand(), 1.6) * 7.5 + 0.15;
    const arm = ((i % arms) / arms) * Math.PI * 2;
    const angle = arm + r * 0.95;
    const spread = Math.pow(rand(), 2.5) * (0.25 + r * 0.18);
    out[i * 3] = Math.cos(angle) * r + gauss() * spread;
    out[i * 3 + 1] = gauss() * 0.25 * (1 - r / 8);
    out[i * 3 + 2] = Math.sin(angle) * r + gauss() * spread;
  }
  return out;
}

/** Lee el nombre dibujado en un canvas y reparte las partículas sobre sus píxeles */
function textShape(n: number, lines: string[], width: number) {
  const out = new Float32Array(n * 3);
  const fs = 220;
  const font = `800 ${fs}px "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif`;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return sphereShape(n);
  ctx.font = font;
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const lineH = fs * 0.9;
  c.width = Math.ceil(textW + 40);
  c.height = Math.ceil(lineH * lines.length + 40);
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, 20 + lineH * (i + 0.5)));

  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const pixels: number[] = [];
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (data[(y * c.width + x) * 4 + 3] > 128) pixels.push(x, y);
    }
  }
  if (!pixels.length) return sphereShape(n);

  const scale = width / c.width;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rand() * (pixels.length / 2)) * 2;
    out[i * 3] = (pixels[k] - c.width / 2 + rand() * 2) * scale;
    out[i * 3 + 1] = -(pixels[k + 1] - c.height / 2 + rand() * 2) * scale;
    out[i * 3 + 2] = gauss() * 0.08;
  }
  return out;
}

async function fontReady() {
  try {
    await Promise.race([
      document.fonts.load('800 220px "Bricolage Grotesque"'),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* sin API de fuentes: se usa la de respaldo */
  }
}

export default function ParticleMorph() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = root.current;
    const host = stage.current;
    if (!section || !host) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      await fontReady();
      if (disposed) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
      } catch {
        section.classList.add("is-static");
        return;
      }

      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const reduced = prefersReducedMotion();
      const count = coarse ? 7000 : 16000;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 1.75));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);

      const portrait = window.innerWidth / window.innerHeight < 0.9;
      const name = site.name.toUpperCase();
      const lines = portrait ? name.split(" ") : [name];
      const textWidth = portrait ? 5.6 : 10;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(sphereShape(count), 3));
      geometry.setAttribute("aS1", new THREE.BufferAttribute(knotShape(count), 3));
      geometry.setAttribute("aS2", new THREE.BufferAttribute(textShape(count, lines, textWidth), 3));
      geometry.setAttribute("aS3", new THREE.BufferAttribute(galaxyShape(count), 3));
      const rnd = new Float32Array(count * 4);
      for (let i = 0; i < rnd.length; i++) rnd[i] = rand();
      geometry.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 4));
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

      const uniforms = {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uSize: { value: coarse ? 0.1 : 0.075 },
        uPixel: { value: 1 },
        uPush: { value: 0 },
        uDive: { value: 0 },
        uCamZ: { value: 9 },
        uMouse: { value: new THREE.Vector3(99, 99, 99) },
        uOpacity: { value: 1 },
        uC1: { value: new THREE.Color("#E9E6DF") },
        uC2: { value: new THREE.Color("#A9BDF2") },
        uC3: { value: new THREE.Color("#2C46B1") },
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // Modo Tokio neón: las partículas pasan a magenta
      const neonC2 = new THREE.Color("#FF3FD0");
      const baseC2 = new THREE.Color("#A9BDF2");
      let c2Target = baseC2;
      const onNeon = (e: Event) => {
        c2Target = (e as CustomEvent<boolean>).detail ? neonC2 : baseC2;
      };
      window.addEventListener("ethan:neon", onNeon);

      let baseZ = 9;
      const resize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Distancia para que el nombre siempre quepa en pantalla
        const half = Math.tan(THREE.MathUtils.degToRad(22.5));
        baseZ = Math.max(9, (textWidth / 2 + 0.6) / (half * camera.aspect));
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      // Puntero -> punto en el plano z = 0 (en coordenadas de las partículas)
      const ndc = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3();
      const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
      let pushTarget = 0;
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        tilt.tx = ndc.x;
        tilt.ty = ndc.y;
        pushTarget = 1;
      };
      const onLeave = () => {
        pushTarget = 0;
        tilt.tx = 0;
        tilt.ty = 0;
      };
      // Clic: onda expansiva que sacude las partículas
      let burst = 0;
      const onDown = () => {
        burst = 1;
      };
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
      section.addEventListener("pointerdown", onDown);

      const chapterEls = Array.from(section.querySelectorAll<HTMLElement>(".morph__chapter"));
      const counter = section.querySelector<HTMLElement>(".morph__count");
      const bar = section.querySelector<HTMLElement>(".morph__bar span");
      let activeChapter = -1;

      const progress = () => {
        const r = section.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      };

      let morph = 0;
      let visible = false;
      let raf = 0;
      let prev = performance.now();
      let clock = 0;
      let swayAngle = 0;
      let roll = 0;

      const frame = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        if (!reduced) clock += dt;

        const p = progress();
        // Cada forma se queda quieta un momento antes de transformarse en la siguiente
        const raw = Math.min(1, p / 0.8) * 3;
        const whole = Math.min(2, Math.floor(raw));
        const target = raw >= 3 ? 3 : whole + THREE.MathUtils.smoothstep(raw - whole, 0.2, 0.85);
        morph += (target - morph) * (reduced ? 1 : 0.08);
        const dive = THREE.MathUtils.smoothstep(p, 0.78, 0.98);

        uniforms.uTime.value = clock;
        uniforms.uMorph.value = morph;
        uniforms.uDive.value = dive;
        uniforms.uCamZ.value = baseZ;
        uniforms.uPush.value += (pushTarget * (1 - dive) - uniforms.uPush.value) * 0.08;
        uniforms.uC2.value.lerp(c2Target, 0.06);

        // Mientras se lee el nombre, deja de balancearse para quedar de frente
        const textWeight = Math.max(0, 1 - Math.abs(morph - 2) * 1.6);
        tilt.x += (tilt.tx - tilt.x) * 0.05;
        tilt.y += (tilt.ty - tilt.y) * 0.05;
        swayAngle = Math.sin(clock * 0.25) * 0.9;
        const still = 1 - dive;
        points.rotation.y = (swayAngle * (1 - textWeight) + tilt.x * 0.35) * still;
        points.rotation.x = -tilt.y * 0.22 * still;
        roll += dt * 0.5 * dive;
        points.rotation.z = roll;

        // Final: salto al hiperespacio, el ángulo de visión se abre con la velocidad
        burst *= 0.9;
        const shake = burst * 0.12 + dive * 0.03;
        camera.position.set(
          tilt.x * 0.4 * still + (Math.random() - 0.5) * shake,
          tilt.y * 0.3 * still + (Math.random() - 0.5) * shake,
          baseZ,
        );
        camera.fov = 45 + dive * 40 + burst * 6;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
        uniforms.uPixel.value =
          renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        uniforms.uOpacity.value = 1 - THREE.MathUtils.smoothstep(p, 0.95, 1);

        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(plane, hit)) {
          points.updateMatrixWorld();
          uniforms.uMouse.value.copy(points.worldToLocal(hit.clone()));
        }

        const chapter = Math.min(3, Math.round(morph));
        if (chapter !== activeChapter) {
          activeChapter = chapter;
          chapterEls.forEach((el, i) => el.classList.toggle("is-active", i === chapter));
          if (counter) counter.textContent = `${String(chapter + 1).padStart(2, "0")} / 0${chapters.length}`;
        }
        if (bar) bar.style.transform = `scaleY(${p})`;
        section.style.setProperty("--dive", dive.toFixed(3));

        renderer.render(scene, camera);
        if (visible) raf = requestAnimationFrame(frame);
      };

      // Solo se dibuja mientras la sección está en pantalla
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) {
          prev = performance.now();
          raf = requestAnimationFrame(frame);
        }
      });
      io.observe(section);
      frame();
      section.classList.add("is-live");

      cleanup = () => {
        visible = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("ethan:neon", onNeon);
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
        section.removeEventListener("pointerdown", onDown);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <section className="morph" id="idea" data-tone="dark" ref={root} data-cursor="Empuja">
      <div className="morph__sticky">
        <div className="morph__stage" ref={stage} aria-hidden="true" />

        <div className="morph__hud" aria-hidden="true">
          <span className="morph__count">01 / 0{chapters.length}</span>
          <span className="morph__bar">
            <span />
          </span>
          <span className="morph__hint">Mueve el cursor · haz clic</span>
        </div>

        <ol className="morph__chapters">
          {chapters.map((c, i) => (
            <li className={`morph__chapter${i === 0 ? " is-active" : ""}`} key={c.title}>
              <span className="morph__jp" lang="ja" aria-hidden="true">
                {c.jp}
              </span>
              <h2 className="morph__title">{c.title}</h2>
              <p className="morph__text">{c.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
