import SplitReveal from "./SplitReveal";
import DotField from "./DotField";

const services = [
  {
    title: "Landing pages",
    text: "Páginas pensadas para lanzar un producto, un evento o una campaña, con animaciones que retienen la atención.",
  },
  {
    title: "E-commerce",
    text: "Tiendas online a medida, rápidas y cómodas de usar desde el celular, con catálogo, carrito y pagos.",
  },
  {
    title: "Sitios y apps con Next.js",
    text: "Desarrollo con React, Next.js y TypeScript, listo para crecer y publicado en Vercel.",
  },
  {
    title: "Integraciones con Supabase",
    text: "Bases de datos, inicio de sesión, formularios y paneles de administración conectados a tu sitio.",
  },
];

export default function Services() {
  return (
    <section className="section" id="servicios" data-tone="light">
      <DotField />
      <div className="section__head">
        <SplitReveal text="Qué hago" className="h2" effect="blur" />
      </div>
      <ul className="rows">
        {services.map((s) => (
          <li className="row row--service" key={s.title}>
            <h3>{s.title}</h3>
            <p className="muted">{s.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
