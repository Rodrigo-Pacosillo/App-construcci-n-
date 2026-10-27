import { HeroSection } from "@/components/sections/HeroSection";
import HomeIntro from "@/components/intro/HomeIntro";
import { Marquee } from "@/components/sections/Marquee";
import { ServiciosSection } from "@/components/sections/ServiciosSection";
import { ProyectosSection } from "@/components/sections/ProyectosSection";
import { CertificacionesSection } from "@/components/sections/CertificacionesSection";
import { TestimoniosSection } from "@/components/sections/TestimoniosSection";
import { NumerosSection } from "@/components/sections/NumerosSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CONSTR-ART — Construcción en Seco y Tradicional",
  description:
    "Contratista independiente de construcción: steel frame, construcción tradicional, soluciones integrales. Cobertura nacional en Bolivia.",
  openGraph: {
    images: [
      {
        url: "/og?title=CONSTR-ART&subtitle=Construcci%C3%B3n%20en%20Seco%20y%20Tradicional&type=dark",
        width: 1200,
        height: 630,
        alt: "CONSTR-ART - Construcción en Seco y Tradicional",
      },
    ],
  },
};

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HomeIntro />
      <HeroSection />
      <Marquee />
      <ServiciosSection />
      
      <CertificacionesSection />
      <TestimoniosSection />
      <NumerosSection />
    </>
  );
}
