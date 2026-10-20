import Link from "next/link";
import { getObras, getClientesParaObra, getContratosParaObra } from "./actions";
import { ObrasAdmin } from "@/components/admin/ObrasAdmin";
import { ESTADOS_OBRA, ESTADO_OBRA_LABELS, type EstadoObraLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ObrasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const [obras, clientes, contratos] = await Promise.all([
    getObras(),
    getClientesParaObra(),
    getContratosParaObra(),
  ]);

  const filtroEstado = ESTADOS_OBRA.includes(estado as EstadoObraLabel)
    ? (estado as EstadoObraLabel)
    : undefined;
  const visibles = filtroEstado
    ? obras.filter((o) => o.estado === filtroEstado)
    : obras;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Obras</h1>
          <p className="mt-1 text-ink-muted">Obras activas y entregadas, con hitos y pagos</p>
        </div>
      </div>

      {filtroEstado && (
        <div className="mt-4 flex items-center gap-3 rounded border border-border bg-surface px-4 py-3 text-sm">
          <span className="text-ink-muted">
            Filtro activo: <strong>{ESTADO_OBRA_LABELS[filtroEstado]}</strong> ({visibles.length})
          </span>
          <Link href="/admin/obras" className="text-accent-strong hover:underline">
            Quitar filtro
          </Link>
        </div>
      )}

      <div className="mt-8">
        <ObrasAdmin obras={visibles} clientes={clientes} contratos={contratos} />
      </div>
    </div>
  );
}