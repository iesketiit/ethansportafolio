"use client";

import { useState } from "react";
import { shotSources, type Project, type ShotVariant } from "@/data/projects";

type Props = {
  project: Project;
  variant?: ShotVariant;
  className?: string;
  eager?: boolean;
  onLoad?: () => void;
};

export default function ProjectImage({ project, variant = "card", className = "", eager = false, onLoad }: Props) {
  const sources = shotSources(project, variant);
  const [index, setIndex] = useState(0);

  if (index >= sources.length) {
    return (
      <div className={`shot-fallback ${className}`} role="img" aria-label={`Vista previa de ${project.name}`}>
        <span>{project.name}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- capturas externas con respaldo local
    <img
      src={sources[index]}
      alt={`Vista previa del sitio de ${project.name}`}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={onLoad}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
