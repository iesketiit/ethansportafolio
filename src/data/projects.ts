export type Project = {
  slug: string;
  name: string;
  category: string;
  url: string;
  role: string;
  /** Texto del caso de estudio. Edítalo con lo que hiciste en cada proyecto. */
  summary: string;
};

export const projects: Project[] = [
  {
    slug: "vibe-bevvy",
    name: "Vibe Bevvy",
    category: "E-commerce",
    url: "https://vibebevvy.com/",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo de la tienda online de Vibe Bevvy.",
  },
  {
    slug: "thirdway",
    name: "Thirdway",
    category: "Arquitectura",
    url: "https://www.thirdway.com/",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo del sitio web de Thirdway.",
  },
  {
    slug: "white-desert",
    name: "White Desert",
    category: "Hotel, viaje y restaurante",
    url: "https://white-desert.com/",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo del sitio web de White Desert.",
  },
  {
    slug: "qissa",
    name: "Qissa",
    category: "Hotel, viaje y restaurante",
    url: "https://www.qissa.co.uk/",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo del sitio web de Qissa.",
  },
  {
    slug: "lingers",
    name: "Lingers",
    category: "Hotel, viaje y restaurante",
    url: "https://www.lingers.it/en",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo del sitio web de Lingers.",
  },
  {
    slug: "velaa",
    name: "Velaa Private Island",
    category: "Fotografía",
    url: "https://www.velaaprivateisland.com/",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo del sitio web de Velaa Private Island.",
  },
  {
    slug: "clemont",
    name: "Clemont",
    category: "Marca",
    url: "https://clemont.co/",
    role: "Diseño y desarrollo web",
    summary: "Diseño y desarrollo del sitio web de Clemont.",
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const getNextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
};

export const domainOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export type ShotVariant = "card" | "full";

/**
 * Orden de imágenes: primero la captura local en /public/proyectos
 * (<slug>.jpg para tarjetas, <slug>-full.jpg para la página completa)
 * y, si no existe, una captura automática del sitio en vivo.
 */
export function shotSources(project: Project, variant: ShotVariant): string[] {
  const local = variant === "card" ? `/proyectos/${project.slug}.jpg` : `/proyectos/${project.slug}-full.jpg`;
  const remote =
    variant === "card"
      ? `https://image.thum.io/get/width/1200/crop/800/noanimate/${project.url}`
      : `https://image.thum.io/get/width/1440/crop/4200/noanimate/${project.url}`;
  return [local, remote];
}
