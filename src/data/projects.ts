export type Project = {
  slug: string;
  name: string;
  category: string;
  url: string;
  role: string;
  /** Texto del caso de estudio. Edítalo con lo que hiciste en cada proyecto. */
  summary: string;
  /** Color del panel del proyecto (por defecto, azul cobalto) */
  accent?: string;
};

export const projects: Project[] = [
  {
    slug: "403-events",
    name: "403 Events",
    category: "Evento",
    url: "https://403events.com/",
    role: "Diseño, desarrollo web y panel de administración",
    summary:
      "Sitio del evento exclusivo de Halloween 403 (Forbidden Event): acceso por solicitud y aprobación, ediciones en varias ciudades y panel de administración conectado a Supabase.",
    accent: "#722F37",
  },
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

export type ShotVariant = "card" | "mid" | "full";

/**
 * Orden de imágenes para cada captura:
 * 1. Tu captura local en /public/proyectos (<slug>.jpg, <slug>-2.jpg, <slug>-full.jpg)
 * 2. Captura automática del sitio en vivo (thum.io)
 * 3. Captura automática de respaldo (microlink)
 */
export function shotSources(project: Project, variant: ShotVariant): string[] {
  const local = {
    card: `/proyectos/${project.slug}.jpg`,
    mid: `/proyectos/${project.slug}-2.jpg`,
    full: `/proyectos/${project.slug}-full.jpg`,
  }[variant];

  const crop = { card: 900, mid: 2600, full: 4200 }[variant];
  const thum = `https://image.thum.io/get/width/1440/crop/${crop}/noanimate/${project.url}`;

  const params = new URLSearchParams({
    url: project.url,
    screenshot: "true",
    meta: "false",
    embed: "screenshot.url",
    "viewport.width": "1440",
    "viewport.height": "900",
  });
  if (variant !== "card") params.set("screenshot.fullPage", "true");
  const microlink = `https://api.microlink.io/?${params.toString()}`;

  return [local, thum, microlink];
}
