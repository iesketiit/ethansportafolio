"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { projects, shotSources, type Project } from "@/data/projects";
import { signature } from "@/data/signature";
import { useNavigate } from "./TransitionProvider";

const GAP = 5.5; // distancia entre cuadros
const START_Z = 3;
const ART_W = 3.2;
const ART_H = 2;
const ART_Y = 1.7;

const frameZ = (i: number) => -3 - i * GAP;
const frameX = (i: number) => (i % 2 === 0 ? -2.7 : 2.7);

/** Textura de respaldo con el nombre del proyecto */
function nameTexture(project: Project) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#8b8b8b";
    ctx.font = "600 72px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(project.name, c.width / 2, c.height / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Carga la captura probando cada fuente; si ninguna sirve, usa el nombre */
function loadArt(project: Project, onReady: (t: THREE.Texture) => void) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const sources = shotSources(project, "card");
  const next = (i: number) => {
    if (i >= sources.length) {
      onReady(nameTexture(project));
      return;
    }
    loader.load(
      sources[i],
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        onReady(t);
      },
      undefined,
      () => next(i + 1),
    );
  };
  next(0);
}

function labelTexture(project: Project) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#E9E6DF";
    ctx.font = "600 88px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText(project.name, 8, 110);
    ctx.fillStyle = "#85837C";
    ctx.font = "400 44px 'IBM Plex Sans JP', Arial, sans-serif";
    ctx.fillText(project.category, 10, 190);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(169,189,242,0.55)");
    g.addColorStop(0.5, "rgba(169,189,242,0.12)");
    g.addColorStop(1, "rgba(169,189,242,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(c);
}

/** Firma en la pared del fondo; se dibuja según cuánto falta para llegar */
function drawSignature(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) {
  const [vx, vy, vw, vh] = signature.viewBox.split(" ").map(Number);
  const scale = Math.min(w / vw, h / vh) * 0.9;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate((w - vw * scale) / 2 - vx * scale, (h - vh * scale) / 2 - vy * scale);
  ctx.scale(scale, scale);
  ctx.transform(1, 0, Math.tan((-10 * Math.PI) / 180), 1, 0, 0);
  ctx.translate(4, 0);
  ctx.lineWidth = 0.9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#E9E6DF";
  ctx.shadowColor = "#A9BDF2";
  ctx.shadowBlur = 14;

  const paths = signature.paths.map((d) => new Path2D(d));
  // Aproximación: cada trazo ocupa un tramo igual del progreso
  const per = 1 / paths.length;
  paths.forEach((p, i) => {
    const local = Math.min(1, Math.max(0, (progress - i * per) / per));
    if (local <= 0) return;
    ctx.setLineDash([400 * local, 400]);
    ctx.stroke(p);
  });
  ctx.restore();
}

export default function Gallery3D() {
  const mount = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    document.documentElement.classList.add("is-gallery");

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.25 : 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050505");
    scene.fog = new THREE.Fog("#050505", 7, 24);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 1.55, START_Z);

    const lastZ = frameZ(projects.length - 1);
    const wallZ = lastZ - 7;
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(o: T) => {
      disposables.push(o);
      return o;
    };

    // Piso semitransparente: deja ver los reflejos de abajo
    const floor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(14, 120)),
      track(new THREE.MeshBasicMaterial({ color: "#070707", transparent: true, opacity: 0.86 })),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -45;
    scene.add(floor);

    // Líneas del piso para dar profundidad
    const lines = new THREE.GridHelper(120, 60, "#1b1b1b", "#121212");
    lines.position.set(0, 0.001, -45);
    scene.add(lines);
    track(lines.geometry);
    track(lines.material as THREE.Material);

    const glow = track(glowTexture());
    const artGeo = track(new THREE.PlaneGeometry(ART_W, ART_H));
    const arts: THREE.Mesh[] = [];

    projects.forEach((p, i) => {
      const x = frameX(i);
      const z = frameZ(i);
      const angle = x < 0 ? 0.42 : -0.42;

      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = angle;

      // Marco
      const frame = new THREE.Mesh(
        track(new THREE.BoxGeometry(ART_W + 0.16, ART_H + 0.16, 0.08)),
        track(new THREE.MeshBasicMaterial({ color: "#161616" })),
      );
      frame.position.set(0, ART_Y, -0.05);
      group.add(frame);

      // Obra
      const mat = track(new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }));
      const art = new THREE.Mesh(artGeo, mat);
      art.position.set(0, ART_Y, 0);
      art.userData.slug = p.slug;
      art.userData.index = i;
      group.add(art);
      arts.push(art);

      // Reflejo en el piso
      const reflMat = track(new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.22 }));
      const refl = new THREE.Mesh(artGeo, reflMat);
      refl.position.set(0, -ART_Y, 0);
      refl.scale.y = -1;
      group.add(refl);

      loadArt(p, (t) => {
        track(t);
        mat.map = t;
        reflMat.map = t;
        mat.needsUpdate = true;
        reflMat.needsUpdate = true;
      });

      // Etiqueta
      const label = new THREE.Mesh(
        track(new THREE.PlaneGeometry(2.4, 0.6)),
        track(new THREE.MeshBasicMaterial({ map: track(labelTexture(p)), transparent: true })),
      );
      label.position.set(-ART_W / 2 + 1.2, ART_Y - ART_H / 2 - 0.5, 0.01);
      group.add(label);

      // Foco de luz en el piso
      const pool = new THREE.Mesh(
        track(new THREE.PlaneGeometry(4.5, 3)),
        track(new THREE.MeshBasicMaterial({ map: glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.01, 0.9);
      group.add(pool);

      scene.add(group);
    });

    // Pared del fondo con la firma
    const sigCanvas = document.createElement("canvas");
    sigCanvas.width = 1400;
    sigCanvas.height = 420;
    const sigCtx = sigCanvas.getContext("2d");
    const sigTex = track(new THREE.CanvasTexture(sigCanvas));
    sigTex.colorSpace = THREE.SRGBColorSpace;
    const sig = new THREE.Mesh(
      track(new THREE.PlaneGeometry(7, 2.1)),
      track(new THREE.MeshBasicMaterial({ map: sigTex, transparent: true, toneMapped: false })),
    );
    sig.position.set(0, 2, wallZ);
    scene.add(sig);
    let sigProgress = -1;

    // Scroll -> avance por el pasillo
    let targetZ = START_Z;
    const endZ = wallZ + 5.5;
    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t = max > 0 ? window.scrollY / max : 0;
      targetZ = START_Z + (endZ - START_Z) * t;
    };
    readScroll();

    const mouse = new THREE.Vector2(0, 0);
    const ndc = new THREE.Vector2(9, 9);
    const raycaster = new THREE.Raycaster();
    let hovered: THREE.Object3D | null = null;

    const onMove = (e: PointerEvent) => {
      mouse.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    const onClick = () => {
      if (hovered) navigate(`/proyectos/${hovered.userData.slug as string}`);
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      readScroll();
    };

    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);

    const look = new THREE.Vector3(0, 1.5, 0);
    let raf = 0;
    let lastIndex = -1;

    const tick = () => {
      camera.position.z += (targetZ - camera.position.z) * 0.07;
      const cz = camera.position.z;

      // La cabeza gira hacia el cuadro más cercano
      let wx = 0;
      let wsum = 0.6;
      let nearest = 0;
      let best = Infinity;
      projects.forEach((_, i) => {
        const dz = cz - 3.4 - frameZ(i);
        const w = Math.exp(-(dz * dz) / 5);
        wx += frameX(i) * w;
        wsum += w;
        if (Math.abs(dz) < best) {
          best = Math.abs(dz);
          nearest = i;
        }
      });
      const tx = (wx / wsum) * 0.85 + mouse.x * 1.2;
      look.x += (tx - look.x) * 0.06;
      look.y += (1.55 - mouse.y * 0.8 - look.y) * 0.06;
      look.z = cz - 5;
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
      camera.lookAt(look);

      if (nearest !== lastIndex) {
        lastIndex = nearest;
        setCurrent(nearest);
      }

      // Cuadro bajo el cursor
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(arts)[0]?.object ?? null;
      if (hit !== hovered) {
        hovered = hit;
        if (hit) renderer.domElement.dataset.cursor = "Ver";
        else delete renderer.domElement.dataset.cursor;
      }
      arts.forEach((a) => {
        const s = a === hovered ? 1.04 : 1;
        a.scale.x += (s - a.scale.x) * 0.15;
        a.scale.y += (s - a.scale.y) * 0.15;
      });

      // Firma: se dibuja durante el último tramo
      const approach = Math.min(1, Math.max(0, (lastZ + 1 - cz) / (lastZ + 1 - endZ)));
      const rounded = Math.round(approach * 200) / 200;
      if (sigCtx && rounded !== sigProgress) {
        sigProgress = rounded;
        drawSignature(sigCtx, sigCanvas.width, sigCanvas.height, rounded);
        sigTex.needsUpdate = true;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("is-gallery");
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [navigate]);

  const p = projects[current];

  return (
    <>
      <div className="gallery__stage" ref={mount} />
      <div className="gallery__hud">
        <div>
          <p className="gallery__count">
            {String(current + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </p>
          <p className="gallery__name">{p.name}</p>
          <p className="gallery__cat">{p.category}</p>
        </div>
        <p className="gallery__hint">Desliza para recorrer la sala. Haz clic en un cuadro para ver el caso.</p>
      </div>
    </>
  );
}
