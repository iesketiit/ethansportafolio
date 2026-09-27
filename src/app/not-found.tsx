import TransitionLink from "@/components/TransitionLink";

export default function NotFound() {
  return (
    <main className="notfound">
      <h1 className="h2">Esta página no existe</h1>
      <p className="muted">Puede que el enlace esté mal escrito o que el proyecto ya no esté publicado.</p>
      <TransitionLink href="/" className="underline">
        Ir al inicio
      </TransitionLink>
    </main>
  );
}
