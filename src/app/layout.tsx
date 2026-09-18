import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
    default: "Steel Frame — Construccion en Seco",
    template: "%s | Steel Frame",
  },
  description:
    "Contratista independiente de construccion en seco: steel frame, drywall, cielorrasos, revestimientos y aislaciones. Zona norte GBA y CABA.",
  metadataBase: new URL("https://steelframe.com.ar"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Steel Frame",
    title: "Steel Frame — Construccion en Seco",
    description:
      "Contratista independiente de construccion en seco: steel frame, drywall, cielorrasos, revestimientos y aislaciones.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Steel Frame — Construccion en Seco",
    description:
      "Contratista independiente de construccion en seco: steel frame, drywall, cielorrasos, revestimientos y aislaciones.",
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
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
