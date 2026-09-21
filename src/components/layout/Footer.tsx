import Link from "next/link";

export function Footer() {
  return (
    <footer className="block border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-heading text-lg font-bold text-ink">
              STEEL<span className="text-accent-strong">FRAME</span>
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Construccion en seco. Steel frame, drywall, cielorrasos,
              revestimientos y aislaciones.
            </p>
          </div>

          <div>
            <p className="section-label mb-3 text-ink-faint">Servicios</p>
            <ul className="space-y-1 text-sm text-ink-muted">
              <li><Link href="/servicios/steel-frame" className="hover:text-accent-strong">Steel Frame</Link></li>
              <li><Link href="/servicios/drywall" className="hover:text-accent-strong">Tabiqueria Drywall</Link></li>
              <li><Link href="/servicios/cielorrasos" className="hover:text-accent-strong">Cielorrasos</Link></li>
              <li><Link href="/servicios/revestimientos" className="hover:text-accent-strong">Revestimientos</Link></li>
              <li><Link href="/servicios/aislaciones" className="hover:text-accent-strong">Aislaciones</Link></li>
            </ul>
          </div>

          <div>
            <p className="section-label mb-3 text-ink-faint">Contacto</p>
            <ul className="space-y-1 text-sm text-ink-muted">
              <li>WhatsApp: +54 11 5555-0000</li>
              <li>Email: info@steelframe.com.ar</li>
              <li>Zona norte GBA y CABA</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center border-t border-border pt-6 text-center text-xs text-ink-faint">
          <p className="section-label">
            &copy; {new Date().getFullYear()} Steel Frame — Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
