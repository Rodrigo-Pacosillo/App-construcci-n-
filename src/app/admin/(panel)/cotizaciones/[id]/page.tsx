import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { CotizacionDetalle } from "@/components/admin/CotizacionDetalle";

type CotizacionDisplay = {
  id: string;
  estado: string;
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  ubicacionObra: string | null;
  montoEstimado: number | null;
  notasInternas: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  cliente: { nombre: string; apellidos: string; telefono: string; email: string | null; ciudad: string | null } | null;
};

export default async function AdminCotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    include: { cliente: true },
  });

  if (!cotizacion) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">COTIZACIÓN NO ENCONTRADA</p>
        <p className="mt-4 text-ink-muted">La cotización solicitada no existe.</p>
      </div>
    );
  }

  const display: CotizacionDisplay = {
    ...cotizacion,
    montoEstimado: cotizacion.montoEstimado ? Number(cotizacion.montoEstimado) : null,
  };

  return <CotizacionDetalle cotizacion={display} />;
}