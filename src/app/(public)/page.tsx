import { HeroSection } from "@/components/sections/HeroSection";
import { Marquee } from "@/components/sections/Marquee";
import { ServiciosSection } from "@/components/sections/ServiciosSection";
import { ProyectosSection } from "@/components/sections/ProyectosSection";
import { CertificacionesSection } from "@/components/sections/CertificacionesSection";
import { TestimoniosSection } from "@/components/sections/TestimoniosSection";
import { NumerosSection } from "@/components/sections/NumerosSection";
import { CtaSection } from "@/components/sections/CtaSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Steel Frame — Construcción en Seco",
  description:
    "Contratista independiente de construcción en seco: steel frame, drywall, cielorrasos, revestimientos y aislaciones. Zona norte GBA y CABA.",
  openGraph: {
    images: [
      {
        url: "/og?title=Steel%20Frame&subtitle=Construcci%C3%B3n%20en%20Seco&type=dark",
        width: 1200,
        height: 630,
        alt: "Steel Frame - Construcción en Seco",
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <Marquee />
      <ServiciosSection />
      <ProyectosSection />
      <CertificacionesSection />
      <TestimoniosSection />
      <NumerosSection />
      <CtaSection />
    </>
  );
}
