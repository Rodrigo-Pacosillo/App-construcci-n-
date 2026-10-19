import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { LocalBusinessJsonLd } from "@/components/seo/StructuredData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "CONSTR-ART — Construcción en Seco y Tradicional",
    template: "%s | CONSTR-ART",
  },
  description:
    "Contratista independiente de construcción: steel frame, construcción tradicional, soluciones integrales. Cobertura nacional en Bolivia.",
  metadataBase: new URL("https://app-construcci-n.vercel.app"),
  openGraph: {
    type: "website",
    locale: "es_BO",
    siteName: "CONSTR-ART",
    title: "CONSTR-ART — Construcción en Seco y Tradicional",
    description:
      "Contratista independiente de construcción en seco, tradicional e integral. Eficiencia y garantía en cada obra. Bolivia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CONSTR-ART — Construcción en Seco y Tradicional",
    description:
      "Contratista independiente de construcción en seco, tradicional e integral. Eficiencia y garantía en cada obra. Bolivia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocalBusinessJsonLd
              name="CONSTR-ART"
              url="https://app-construcci-n.vercel.app"
              logo="https://app-construcci-n.vercel.app/logo.png"
              telephone="+591 70646xxx"
              email="niwdecc7@gmail.com"
              address={{
                streetAddress: "Calle Principal 123",
                addressLocality: "Santa Cruz de la Sierra",
                addressRegion: "Santa Cruz",
                addressCountry: "BO",
              }}
              geo={{
                latitude: -17.7833,
                longitude: -63.1821,
              }}
              priceRange="$$"
              description="Contratista independiente de construcción: steel frame, construcción tradicional, soluciones integrales. Cobertura nacional en Bolivia."
              sameAs={[
                "https://www.facebook.com/construccion.art",
                "https://www.instagram.com/construccion.art",
                "https://www.tiktok.com/@construccion.art",
              ]}
            />
            <a href="#main-content" className="skip-link">
              Saltar al contenido principal
            </a>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
