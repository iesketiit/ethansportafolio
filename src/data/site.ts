export const site = {
  name: "Ethan S",
  role: "Comunicador social y desarrollador web",
  description:
    "Portafolio de Ethan S: diseño y desarrollo web e integraciones con IA para marcas de eventos, e-commerce, arquitectura, hotelería, fotografía y branding.",
  phoneDisplay: "+81 90-5474-1253",
  phoneIntl: "819054741253",
};

export const waLink = (message: string) =>
  `https://wa.me/${site.phoneIntl}?text=${encodeURIComponent(message)}`;

/** Botón "Cotiza aquí" */
export const whatsappUrl = waLink("Hola Ethan, vi tu portafolio y me gustaría cotizar un proyecto web.");
/** Botón "Agenda una llamada" */
export const callUrl = waLink("Hola Ethan, vi tu portafolio. ¿Podemos agendar una llamada?");
export const telUrl = `tel:+${site.phoneIntl}`;
