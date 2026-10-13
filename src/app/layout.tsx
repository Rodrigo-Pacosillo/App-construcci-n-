import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
