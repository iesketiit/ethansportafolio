"use client";

import { useEffect, useState } from "react";
import { onWeather, type TokyoWeather } from "@/lib/tokyo";

/** "Tokio ahora: 18 °C, lluvia" */
export default function TokyoBadge() {
  const [w, setW] = useState<TokyoWeather | null>(null);
  useEffect(() => onWeather(setW), []);
  if (!w) return null;
  return (
    <span className="tokyo-badge" title="Clima en vivo en Tokio">
      <span className="tokyo-badge__icon" aria-hidden="true">
        {w.isDay ? w.icon : w.kind === "clear" ? "☾" : w.icon}
      </span>
      Tokio ahora: {w.temp !== null ? `${w.temp} °C, ` : ""}
      {w.isDay || w.kind !== "clear" ? w.label : "noche despejada"}
    </span>
  );
}
