import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedí tu presupuesto",
  description:
    "Solicita tu cotización para construcción en seco. Steel frame, drywall, cielorrasos y más. Respuesta en 24hs.",
  openGraph: {
    images: [
      {
        url: "/og?title=Pedi%20tu%20presupuesto&subtitle=Cotizaci%C3%B3n%20en%2024hs%20-%20Sin%20compromiso&type=default",
        width: 1200,
        height: 630,
        alt: "Cotización Steel Frame",
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