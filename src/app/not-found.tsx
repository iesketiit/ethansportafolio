import NotFoundArt from "@/components/NotFoundArt";
import TransitionLink from "@/components/TransitionLink";

export default function NotFound() {
  return (
    <main className="notfound" data-tone="dark">
      <NotFoundArt />
      <p className="muted notfound__text">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <TransitionLink href="/" className="pill pill--light" data-scramble>
        Volver al inicio
      </TransitionLink>
    </main>
  );
}
