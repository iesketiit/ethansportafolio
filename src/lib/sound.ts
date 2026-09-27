"use client";

// Sonidos sintetizados con Web Audio: no hay archivos que cargar.
const KEY = "ethan:sound";
const listeners = new Set<() => void>();

let enabled = true;
let loaded = false;
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    enabled = localStorage.getItem(KEY) !== "0";
  } catch {
    /* sin almacenamiento */
  }
}

export function isSoundOn() {
  load();
  return enabled;
}

export function setSoundOn(value: boolean) {
  load();
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* sin almacenamiento */
  }
  listeners.forEach((l) => l());
  if (value) playClick();
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCtx(create: boolean) {
  if (!ctx && create) {
    const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx && ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, type: OscillatorType, from: number, to: number, dur: number, peak: number, at = 0) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Clic seco y corto */
export function playClick() {
  if (!isSoundOn()) return;
  const c = getCtx(true);
  if (!c) return;
  tone(c, "sine", 1300, 380, 0.09, 0.14);
  tone(c, "triangle", 2800, 1900, 0.035, 0.04);
}

/** Tic muy suave al pasar sobre enlaces (solo después del primer clic) */
export function playHover() {
  if (!isSoundOn()) return;
  const c = getCtx(false);
  if (!c || c.state !== "running") return;
  tone(c, "sine", 2400, 2100, 0.045, 0.02);
}

/** Barrido de aire para las transiciones de página */
export function playWhoosh() {
  if (!isSoundOn()) return;
  const c = getCtx(true);
  if (!c) return;
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.1;
  filter.frequency.setValueAtTime(280, t);
  filter.frequency.exponentialRampToValueAtTime(2600, t + 0.7);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.1, t + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + 0.85);
}

/** Rasgueo de pluma sobre papel */
export function playScratch(duration = 0.9) {
  if (!isSoundOn()) return;
  const c = getCtx(true);
  if (!c) return;
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const hp = c.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = 3200;
  hp.Q.value = 0.8;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  // Volumen irregular: la pluma presiona y suelta
  const steps = Math.round(duration * 14);
  for (let i = 0; i <= steps; i++) {
    const at = t + (i / steps) * duration;
    gain.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.03, at);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.08);
  src.connect(hp).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + duration + 0.1);
}

/** Golpe sordo (letras que caen y rebotan) */
export function playThud(strength = 1) {
  if (!isSoundOn()) return;
  const c = getCtx(true);
  if (!c) return;
  tone(c, "sine", 170, 55, 0.18, Math.min(0.22, 0.06 + strength * 0.03));
}

/** Arpegio de arcade (modo Tokio neón) */
export function playArcade() {
  if (!isSoundOn()) return;
  const c = getCtx(true);
  if (!c) return;
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((f, i) => tone(c, "square", f, f * 0.99, 0.11, 0.045, i * 0.085));
}
