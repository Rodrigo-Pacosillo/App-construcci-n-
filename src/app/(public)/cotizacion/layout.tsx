import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedí tu presupuesto",
  description:
    "Solicita tu cotizacion para construccion en seco. Steel frame, drywall, cielorrasos y mas. Respuesta en 24hs.",
  openGraph: {
    images: [
      {
        url: "/og?title=Pedi%20tu%20presupuesto&subtitle=Cotizacion%20en%2024hs%20-%20Sin%20compromiso&type=default",
        width: 1200,
        height: 630,
        alt: "Cotizacion Steel Frame",
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