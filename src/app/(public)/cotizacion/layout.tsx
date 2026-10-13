import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedí tu presupuesto",
  description:
    "Solicita tu cotización para construcción en seco, tradicional o integral. Cobramos por m². Respuesta en 24hs. Cobertura nacional Bolivia.",
  openGraph: {
    images: [
      {
        url: "/og?title=Pedi%20tu%20presupuesto&subtitle=Cotizaci%C3%B3n%20por%20m2%20-%20Respuesta%2024hs&type=default",
        width: 1200,
        height: 630,
        alt: "Cotización CONSTR-ART",
      },
    ],
  },
};

export default function CotizacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}