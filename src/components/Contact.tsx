import Magnetic from "./Magnetic";
import SplitReveal from "./SplitReveal";
import { site, telUrl, whatsappUrl } from "@/data/site";

export default function Contact() {
  return (
    <section className="section contact" id="contacto">
      <SplitReveal text="Hablemos" className="contact__title" />
      <div className="contact__row">
        <div>
          <p className="muted">¿Tienes un proyecto en mente? Escríbeme y lo conversamos.</p>
          <a className="contact__phone" href={telUrl}>
            {site.phoneDisplay}
          </a>
        </div>
        <Magnetic strength={0.4}>
          <a className="btn-circle" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            Escríbeme por WhatsApp
          </a>
        </Magnetic>
      </div>
    </section>
  );
}
