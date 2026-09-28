"use client";

export type WeatherKind = "clear" | "clouds" | "fog" | "rain" | "storm" | "snow";

export type TokyoWeather = {
  kind: WeatherKind;
  temp: number | null;
  isDay: boolean;
  /** Hora actual en Japón (0-23) */
  hour: number;
  label: string;
  icon: string;
};

export const WEATHER_EVENT = "ethan:weather";
const CACHE_KEY = "ethan:tokyo";
const TTL = 15 * 60 * 1000;

declare global {
  interface Window {
    __ethanWeather?: TokyoWeather;
  }
}

const LABELS: Record<WeatherKind, { label: string; icon: string }> = {
  clear: { label: "despejado", icon: "☀" },
  clouds: { label: "nublado", icon: "☁" },
  fog: { label: "niebla", icon: "≋" },
  rain: { label: "lluvia", icon: "☂" },
  storm: { label: "tormenta", icon: "ϟ" },
  snow: { label: "nieve", icon: "❄" },
};

// Códigos WMO de Open-Meteo
function kindFromCode(code: number): WeatherKind {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2) return "clouds";
  return "clear";
}

export function japanHour() {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tokyo" }).format(new Date())) % 24;
}

function build(kind: WeatherKind, temp: number | null, isDay: boolean): TokyoWeather {
  return { kind, temp, isDay, hour: japanHour(), ...LABELS[kind] };
}

/** Modo de prueba: ?clima=lluvia | tormenta | nieve | niebla | nublado | despejado | noche */
function override(): TokyoWeather | null {
  const param = new URLSearchParams(window.location.search).get("clima");
  if (!param) return null;
  const map: Record<string, WeatherKind> = {
    lluvia: "rain",
    tormenta: "storm",
    nieve: "snow",
    niebla: "fog",
    nublado: "clouds",
    despejado: "clear",
    noche: "clear",
  };
  const kind = map[param.toLowerCase()];
  if (!kind) return null;
  const night = param.toLowerCase() === "noche";
  return build(kind, 18, !night && japanHour() >= 6 && japanHour() < 18);
}

async function fetchWeather(): Promise<TokyoWeather | null> {
  const forced = override();
  if (forced) return forced;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { at, kind, temp, isDay } = JSON.parse(cached);
      if (Date.now() - at < TTL) return build(kind, temp, isDay);
    }
  } catch {
    /* sin almacenamiento */
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=35.6762&longitude=139.6503&current=temperature_2m,weather_code,is_day&timezone=Asia%2FTokyo";
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const kind = kindFromCode(Number(data?.current?.weather_code ?? 0));
    const temp = typeof data?.current?.temperature_2m === "number" ? Math.round(data.current.temperature_2m) : null;
    const isDay = data?.current?.is_day === 1;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), kind, temp, isDay }));
    } catch {
      /* sin almacenamiento */
    }
    return build(kind, temp, isDay);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Consulta el clima de Tokio y avisa a toda la web */
export async function refreshWeather() {
  const w = await fetchWeather();
  if (!w) return;
  window.__ethanWeather = w;
  window.dispatchEvent(new CustomEvent<TokyoWeather>(WEATHER_EVENT, { detail: w }));
}

/** Escucha el clima (recibe el actual si ya se conoce) */
export function onWeather(cb: (w: TokyoWeather) => void) {
  if (window.__ethanWeather) cb(window.__ethanWeather);
  const handler = (e: Event) => cb((e as CustomEvent<TokyoWeather>).detail);
  window.addEventListener(WEATHER_EVENT, handler);
  return () => window.removeEventListener(WEATHER_EVENT, handler);
}
