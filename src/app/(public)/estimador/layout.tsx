import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estimador de costos",
  description:
    "Calcula una referencia orientativa del costo por m2 de tu obra en steel frame o construccion tradicional.",
  openGraph: {
    images: [
      {
        url: "/og?title=Estimador%20de%20costos&subtitle=Referencia%20orientativa%20por%20m2%20en%203%20pasos&type=default",
        width: 1200,
        height: 630,
        alt: "Estimador Steel Frame",
      },
    ],
  },
};

export default function EstimadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}