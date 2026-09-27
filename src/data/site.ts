export const site = {
  name: "Ethan S",
  role: "Comunicador social y desarrollador web",
  description:
    "Portafolio de Ethan S: diseño y desarrollo web para marcas de e-commerce, arquitectura, hotelería, fotografía y branding.",
  phoneDisplay: "+81 90-5474-1253",
  phoneIntl: "819054741253",
  whatsappMessage: "Hola Ethan, vi tu portafolio y me gustaría cotizar un proyecto web.",
};

export const whatsappUrl = `https://wa.me/${site.phoneIntl}?text=${encodeURIComponent(site.whatsappMessage)}`;
export const telUrl = `tel:+${site.phoneIntl}`;
