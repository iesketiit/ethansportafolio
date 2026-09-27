"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { onIntroDone, prefersReducedMotion } from "@/lib/motion";

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Tinta líquida: ruido fbm con deformación de dominio, reacciona al mouse y al scroll
const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform vec3 uGlow;
  uniform float uVel;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p = m * p;
      a *= 0.5;
    }
    return v * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float d = length(uv - m);
    uv += (uv - m) * 0.35 * exp(-d * 3.0);
    float warp = 3.5 + uVel * 3.5;

    float t = uTime * 0.03;
    vec2 p = uv * 0.75 + vec2(0.0, uScroll * 0.25);
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + warp * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + warp * q + vec2(8.3, 2.8) - t * 1.1));
    float f = fbm(p + warp * r);

    vec3 col = vec3(0.085, 0.083, 0.08) * smoothstep(0.35, 0.9, f);
    float rim = smoothstep(0.62, 0.92, f) * smoothstep(0.2, 0.8, length(q));
    col += uGlow * rim * 0.18;
    col += uGlow * 0.09 * exp(-d * 5.0);

    vec2 c = (gl_FragCoord.xy / uRes - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    col *= smoothstep(1.3, 0.2, length(c));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function WebGLBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      return; // Sin WebGL: queda el fondo negro
    }

    // Resolución reducida: el efecto es suave y así rinde bien en cualquier equipo
    const pixelRatio = Math.min(window.devicePixelRatio, 2) * 0.5;
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uGlow: { value: new THREE.Color("#A9BDF2") },
      uVel: { value: 0 },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.getDrawingBufferSize(uniforms.uRes.value);
    };
    resize();

    const mouseTarget = new THREE.Vector2(0.5, 0.5);
    const onMove = (e: PointerEvent) => {
      mouseTarget.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };

    // En el celular, inclinar el teléfono mueve la tinta
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const x = Math.min(1, Math.max(0, 0.5 + e.gamma / 50));
      const y = Math.min(1, Math.max(0, 0.5 - (e.beta - 45) / 50));
      mouseTarget.set(x, y);
    };
    type PermissionAPI = { requestPermission?: () => Promise<string> };
    const orientation = (window.DeviceOrientationEvent ?? null) as unknown as PermissionAPI | null;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const askPermission = () => {
      orientation
        ?.requestPermission?.()
        .then((state) => {
          if (state === "granted") window.addEventListener("deviceorientation", onTilt);
        })
        .catch(() => {});
    };
    if (coarse && orientation) {
      if (typeof orientation.requestPermission === "function") {
        // iOS pide permiso: se solicita con el primer toque
        window.addEventListener("touchend", askPermission, { once: true });
      } else {
        window.addEventListener("deviceorientation", onTilt);
      }
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);

    const reduced = prefersReducedMotion();
    let raf = 0;
    let running = true;
    let prev = performance.now();
    let clock = 0;
    let lastScroll = window.scrollY;

    const render = () => {
      // El líquido se agita y acelera cuanto más rápido haces scroll
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const speed = Math.min(1, Math.abs(window.scrollY - lastScroll) / 60);
      lastScroll = window.scrollY;
      uniforms.uVel.value += (speed - uniforms.uVel.value) * 0.06;
      clock += dt * (1 + uniforms.uVel.value * 7);
      uniforms.uTime.value = clock;
      uniforms.uMouse.value.lerp(mouseTarget, 0.05);
      uniforms.uScroll.value += (window.scrollY / window.innerHeight - uniforms.uScroll.value) * 0.08;
      renderer.render(scene, camera);
      if (running && !reduced) raf = requestAnimationFrame(render);
    };

    // Mientras la pluma firma, el fondo no se anima: todo el rendimiento va a la firma
    running = false;
    render();
    const offIntro = onIntroDone(() => {
      if (reduced || document.hidden) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(render);
    });

    const onVisibility = () => {
      if (reduced || !window.__ethanIntroDone) return;
      running = !document.hidden;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      offIntro();
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("touchend", askPermission);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="gl-bg" ref={ref} aria-hidden="true" />;
}
