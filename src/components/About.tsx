import ScrubText from "./ScrubText";
import SplitReveal from "./SplitReveal";
import PathList from "./PathList";

const path = [
  { place: "Columbia University, Nueva York", detail: "Comunicación y Ciencias Sociales", ghost: "NEW YORK" },
  { place: "NextU y Harvard", detail: "Cursos de marketing, diseño gráfico y más, en mis vacaciones", ghost: "HARVARD" },
  { place: "Columbia University", detail: "Maestría en Desarrollo Web", ghost: "MASTER" },
  { place: "Japón", detail: "Experiencia profesional", ghost: "日本" },
];

export default function About() {
  return (
    <section className="section" id="sobre-mi" data-tone="blue">
      <span className="ghost-word" aria-hidden="true" />
      <div className="section__head">
        <SplitReveal text="Sobre mí" className="h2" effect="blur" />
      </div>

      <ScrubText
        repel
        className="about__lead"
        text="Estudié Comunicación y Ciencias Sociales en Columbia University, en Nueva York. En vacaciones sumé cursos de marketing y diseño gráfico en NextU y Harvard. Después volví a Columbia para hacer una maestría en lo que más me apasiona: el desarrollo web."
      />

      <div className="about__grid">
        <p className="muted about__note">
          Por eso cada sitio que hago empieza por el mensaje: qué tiene que sentir quien entra, antes de escribir una línea de código.
        </p>
        <PathList items={path} />
      </div>
    </section>
  );
}
