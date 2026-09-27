"use client";

import { useNavigate } from "./TransitionProvider";
import { site, whatsappUrl } from "@/data/site";

export default function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="footer">
      <span>
        © {new Date().getFullYear()} {site.name}
      </span>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <button onClick={() => navigate(window.location.pathname)}>Volver arriba</button>
    </footer>
  );
}
