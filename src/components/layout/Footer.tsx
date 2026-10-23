"use client";

import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";
import {
  Mail,
  Phone,
} from "lucide-react";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/construccion.art",
    icon: FaFacebook,
    ariaLabel: "Síguenos en Facebook",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/construccion.art",
    icon: FaInstagram,
    ariaLabel: "Síguenos en Instagram",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@construccion.art",
    icon: FaTiktok,
    ariaLabel: "Síguenos en TikTok",
  },
] as const;

const QUICK_SERVICES = [
  { label: "Steel Frame", href: "/servicios/steel-frame" },
  { label: "Tabiquería Drywall", href: "/servicios/drywall" },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="block border-t border-border" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        {/* Grid responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Marca */}
          <div className="space-y-3">
            <Link href="/" className="font-heading text-lg font-bold text-ink" aria-label="CONSTR-ART - Inicio">
              CONSTR-ART
            </Link>
            <p className="text-sm text-ink-muted leading-relaxed max-w-xs">
              Especialista en construcción en seco, STEEL FRAME. Soluciones integrales y construcción tradicional.
            </p>
          </div>

          {/* Col 2: Servicios rápidos (2 + ver más) */}
          <nav aria-label="Servicios principales">
            <h2 className="section-label mb-3 text-ink-faint">Servicios</h2>
            <ul className="space-y-2" role="list">
              {QUICK_SERVICES.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="text-sm text-ink-muted transition-colors hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong focus-visible:outline-offset-2 rounded"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/servicios"
                  className="text-sm text-accent-strong hover:underline font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong focus-visible:outline-offset-2 rounded"
                >
                  Ver todos los servicios →
                </Link>
              </li>
            </ul>
          </nav>

          {/* Col 3: Contacto */}
          <address className="space-y-3" aria-label="Contacto">
            <h2 className="section-label text-ink-faint">Contacto</h2>
            <ul className="space-y-2.5 text-sm text-ink-muted" role="list">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-xs text-ink-faint">Teléfono</span>
                  <a
                    href="https://wa.me/59168078184"
                    className="transition-colors hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong focus-visible:outline-offset-2 rounded"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +591 68078184
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-xs text-ink-faint">Correo electrónico</span>
                  <a
                    href="mailto:niwdecc7@gmail.com"
                    className="transition-colors hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong focus-visible:outline-offset-2 rounded"
                  >
                    niwdecc7@gmail.com
                  </a>
                </div>
              </li>
            </ul>
          </address>

          {/* Col 4: Redes sociales */}
          <nav aria-label="Redes sociales">
            <h2 className="section-label mb-3 text-ink-faint">Síguenos</h2>
            <ul className="flex gap-3" role="list">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.ariaLabel}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-accent-strong hover:bg-accent-strong/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-strong focus-visible:outline-offset-2"
                  >
                    <social.icon className="h-5 w-5 text-ink-muted transition-colors" aria-hidden="true" />
                    <span className="sr-only">{social.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Copyright EXACTO al original - full width */}
        <div className="mt-8 flex items-center justify-center border-t border-border pt-6 text-center text-xs text-ink-faint">
          <p className="section-label">
            &copy; {currentYear} CONSTR-ART — Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}