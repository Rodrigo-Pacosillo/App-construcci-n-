import Link from "next/link";

export function Footer() {
  return (
    <footer className="block border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-heading text-lg font-bold text-ink">
              CONSTR-ART
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Especialista en construcción en seco, STEEL FRAME. Soluciones
              integrales y construcción tradicional.
            </p>
          </div>

          <div>
            <p className="section-label mb-3 text-ink-faint">Servicios</p>
            <ul className="space-y-1 text-sm text-ink-muted">
              <li>
                <Link
                  href="/servicios/steel-frame"
                  className="hover:text-accent-strong"
                >
                  Steel Frame
                </Link>
              </li>
              <li>
                <Link
                  href="/servicios/drywall"
                  className="hover:text-accent-strong"
                >
                  Tabiquería Drywall
                </Link>
              </li>
              <li>
                <Link
                  href="/servicios/cielorrasos"
                  className="hover:text-accent-strong"
                >
                  Cielorrasos
                </Link>
              </li>
              <li>
                <Link
                  href="/servicios/revestimientos"
                  className="hover:text-accent-strong"
                >
                  Revestimientos
                </Link>
              </li>
              <li>
                <Link
                  href="/servicios/aislaciones"
                  className="hover:text-accent-strong"
                >
                  Aislaciones Térmicas y Acústicas
                </Link>
              </li>
              <li>
                <Link
                  href="/servicios/habilitaciones"
                  className="hover:text-accent-strong"
                >
                  Habilitaciones de Locales
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="section-label mb-3 text-ink-faint">Contacto</p>
            <ul className="space-y-1 text-sm text-ink-muted">
              <li>WhatsApp: +591 70646xxx</li>
              <li>Email: niwdecc7@gmail.com</li>
              <li>
                <a href="#" className="hover:text-accent-strong" aria-label="TikTok">
                  TikTok
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent-strong" aria-label="Facebook">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center border-t border-border pt-6 text-center text-xs text-ink-faint">
          <p className="section-label">
            &copy; {new Date().getFullYear()} CONSTR-ART — Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}