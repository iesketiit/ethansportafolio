"use client";

import { useSyncExternalStore } from "react";
import { isSoundOn, setSoundOn, subscribeSound } from "@/lib/sound";

export default function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundOn, () => true);

  return (
    <button
      className={`sound ${on ? "is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Silenciar sonidos" : "Activar sonidos"}
      onClick={() => setSoundOn(!on)}
    >
      <span className="sound__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound__label">{on ? "Sonido" : "Silencio"}</span>
    </button>
  );
}
