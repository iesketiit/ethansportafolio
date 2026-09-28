"use client";

import { useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { collapsePage } from "@/lib/collapse";

/** Botón "No tocar": si lo presionan, toda la página se derrumba. */
export default function DontTouch() {
  const [label, setLabel] = useState("No tocar");
  const [busy, setBusy] = useState(false);

  const onClick = () => {
    if (busy || prefersReducedMotion()) return;
    setBusy(true);
    setLabel("Te dije que no");
    void collapsePage(() => {
      setBusy(false);
      window.setTimeout(() => setLabel("No tocar"), 1500);
    });
  };

  return (
    <button className="dont-touch" onClick={onClick} disabled={busy} aria-label="No tocar: derrumba la página">
      <span className="dont-touch__dot" aria-hidden="true" />
      {label}
    </button>
  );
}
