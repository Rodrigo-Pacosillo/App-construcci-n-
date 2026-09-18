import { HeroSection } from "@/components/sections/HeroSection";
import { Marquee } from "@/components/sections/Marquee";
import { ServiciosSection } from "@/components/sections/ServiciosSection";
import { ProyectosSection } from "@/components/sections/ProyectosSection";
import { TestimoniosSection } from "@/components/sections/TestimoniosSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { NumerosSection } from "@/components/sections/NumerosSection";
import { CtaSection } from "@/components/sections/CtaSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Marquee />
      <ServiciosSection />
      <ProyectosSection />
      <NumerosSection />
      <TestimoniosSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
