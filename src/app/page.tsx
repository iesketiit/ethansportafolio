import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import ScrollPen from "@/components/ScrollPen";
import Services from "@/components/Services";

export default function Home() {
  return (
    <main>
      <ScrollPen />
      <Hero />
      <Projects />
      <About />
      <Services />
      <Contact />
      <Footer />
    </main>
  );
}
