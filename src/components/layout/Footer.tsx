import Link from "next/link";

export function Footer() {
  return (
    <footer className="block-dark border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-heading text-lg font-bold text-white">
              STEEL<span className="text-accent">FRAME</span>
            </p>
            <p className="mt-2 text-sm text-white/50">
              Construccion en seco. Steel frame, drywall, cielorrasos,
              revestimientos y aislaciones.
            </p>
          </div>

          <div>
            <p className="section-label mb-3 text-white/40">Servicios</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li><Link href="/servicios/steel-frame" className="hover:text-accent">Steel Frame</Link></li>
              <li><Link href="/servicios/drywall" className="hover:text-accent">Tabiqueria Drywall</Link></li>
              <li><Link href="/servicios/cielorrasos" className="hover:text-accent">Cielorrasos</Link></li>
              <li><Link href="/servicios/revestimientos" className="hover:text-accent">Revestimientos</Link></li>
              <li><Link href="/servicios/aislaciones" className="hover:text-accent">Aislaciones</Link></li>
            </ul>
          </div>

          <div>
            <p className="section-label mb-3 text-white/40">Contacto</p>
            <ul className="space-y-1 text-sm text-white/60">
              <li>WhatsApp: +54 11 5555-0000</li>
              <li>Email: info@steelframe.com.ar</li>
              <li>Zona norte GBA y CABA</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-center text-xs text-white/30 sm:flex-row sm:text-left">
          <p className="section-label">
            &copy; {new Date().getFullYear()} Steel Frame — Todos los derechos reservados
          </p>
          <Link
            href="/admin/login"
            className="section-label text-white/30 transition-colors hover:text-accent"
          >
            Ingreso
          </Link>
        </div>
      </div>
    </footer>
  );
}
