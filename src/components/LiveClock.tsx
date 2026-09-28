"use client";

import { useEffect, useState } from "react";

type Parts = { japan: [string, string]; local: [string, string]; sameZone: boolean; asleep: boolean };

const fmt = (timeZone?: string) =>
  new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });

function read(): Parts {
  const now = new Date();
  const japan = fmt("Asia/Tokyo").format(now).split(":") as [string, string];
  const local = fmt().format(now).split(":") as [string, string];
  const sameZone = Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Tokyo";
  const hour = Number(japan[0]);
  return { japan, local, sameZone, asleep: hour >= 0 && hour < 7 };
}

function Time({ value }: { value: [string, string] }) {
  return (
    <strong>
      {value[0]}
      <span className="clock__colon">:</span>
      {value[1]}
    </strong>
  );
}

/** "¿Hablamos? En Japón son las 22:42. Para ti, las 08:42." — se actualiza sola. */
export default function LiveClock() {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(read());
    const id = window.setInterval(() => setParts(read()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  if (!parts) return <p className="clock" aria-hidden="true">&nbsp;</p>;

  return (
    <p className="clock">
      ¿Hablamos? En Japón son las <Time value={parts.japan} />
      {parts.sameZone ? "." : <>. Para ti, las <Time value={parts.local} />.</>}
      {parts.asleep && <span className="clock__sleep"> Probablemente estoy durmiendo; te respondo en unas horas.</span>}
    </p>
  );
}
