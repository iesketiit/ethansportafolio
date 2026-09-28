import type { Metadata } from "next";
import Gallery3D from "@/components/Gallery3D";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Galería 3D",
  description: "Recorre los proyectos de Ethan S en una sala 3D.",
};

export default function GalleryPage() {
  return (
    <main className="gallery" data-tone="dark" style={{ height: `${projects.length * 60 + 160}vh` }}>
      <h1 className="sr-only">Galería 3D de proyectos</h1>
      <Gallery3D />
    </main>
  );
}
