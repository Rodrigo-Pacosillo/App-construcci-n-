import Link from "next/link";
import {
  FileText,
  FileCheck,
  HardHat,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth-utils";
import { formatFecha } from "@/lib/format";
import {
  getActividadReciente,
  getDashboardStats,
  type Actividad,
} from "./actions";

export default async function AdminDashboard() {
  const session = await requireAdmin();

  const [stats, actividad] = await Promise.all([
    getDashboardStats(),
    getActividadReciente(),
  ]);

  return (
    <div className="max-w-6xl p-4 lg:p-8">
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Panel principal
        </h1>
        <p className="mt-2 text-ink-muted">
          Bienvenido, {session.user?.name || "Admin"}
        </p>
      </header>

      {/* 1. Resumen */}
      <section className="mb-10">
        <h2 className="section-label mb-4 text-ink-faint">RESUMEN</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ResumenCard
            titulo="Cotizaciones nuevas"
            valor={stats.nuevas}
            detalle={
              stats.nuevas === 0
                ? "Sin cotizaciones pendientes de revisar"
                : "Sin contactar todavía"
            }
            href="/admin/cotizaciones?estado=nuevo"
          />
          <ResumenCard
            titulo="Contactadas"
            valor={stats.contactadasSemana}
            detalle="En los últimos 7 días"
            href="/admin/cotizaciones?estado=contactado"
          />
        </div>
      </section>

      {/* 2. Acciones rápidas */}
      <section className="mb-10">
        <h2 className="section-label mb-4 text-ink-faint">ACCIONES RÁPIDAS</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AccionRapida
            href="/admin/cotizaciones"
            titulo="+ Cotización"
            detalle="Revisar el embudo y cargar una cotización"
          />
          <AccionRapida
            href="/admin/contratos/new"
            titulo="+ Contrato"
            detalle="Crear un contrato desde una cotización contratada"
          />
          <AccionRapida
            href="/admin/obras"
            titulo="+ Obra"
            detalle="Crear o gestionar una nueva obra"
          />
        </div>
      </section>

      {/* 3. Historial */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="section-label text-ink-faint">HISTORIAL</h2>
          <Link
            href="/admin/cotizaciones"
            className="text-sm font-medium text-accent-strong hover:underline"
          >
            Ver todas las cotizaciones →
          </Link>
        </div>
        {actividad.length > 0 ? (
          <div className="divide-y divide-border rounded border border-border bg-surface">
            {actividad.map((evento) => (
              <ActividadRow key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <div className="rounded border border-border bg-surface px-4 py-8 text-center text-sm text-ink-faint">
            No hay actividad registrada aún.
          </div>
        )}
      </section>
    </div>
  );
}

/* --- Componentes auxiliares --- */

function ResumenCard({
  titulo,
  valor,
  detalle,
  href,
}: {
  titulo: string;
  valor: number;
  detalle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded border border-border bg-surface p-6 transition-colors hover:border-accent"
    >
      <p className="section-label text-ink-faint">{titulo}</p>
      <p className="mt-4 font-heading text-5xl font-bold text-ink">{valor}</p>
      <p className="mt-2 text-sm text-ink-muted">{detalle}</p>
    </Link>
  );
}

function AccionRapida({
  href,
  titulo,
  detalle,
}: {
  href: string;
  titulo: string;
  detalle: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded border border-border bg-surface p-6 transition-colors hover:border-accent"
    >
      <p className="font-heading text-lg font-bold">{titulo}</p>
      <p className="mt-2 text-sm text-ink-muted">{detalle}</p>
    </Link>
  );
}

const ACTIVIDAD_ICONS: Record<Actividad["tipo"], LucideIcon> = {
  cotizacion_creada: FileText,
  cotizacion_actualizada: PencilLine,
  contrato_creado: FileCheck,
  obra_iniciada: HardHat,
};

function ActividadRow({ evento }: { evento: Actividad }) {
  const Icon = ACTIVIDAD_ICONS[evento.tipo];

  return (
    <Link
      href={evento.href}
      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-ink/5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ink/5 text-ink-muted">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{evento.titulo}</p>
        <p className="truncate text-xs text-ink-faint">{evento.cliente}</p>
      </div>
      <span className="shrink-0 text-xs text-ink-faint">
        {formatFechaRelativa(evento.fecha)}
      </span>
    </Link>
  );
}

function formatFechaRelativa(fecha: Date): string {
  const diff = Date.now() - fecha.getTime();
  const minutos = Math.floor(diff / 60000);

  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;

  return formatFecha(fecha);
}
