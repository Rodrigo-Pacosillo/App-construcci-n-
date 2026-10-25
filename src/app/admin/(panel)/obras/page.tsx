import Link from "next/link";
import { getObras, getClientesParaObra, getContratosParaObra } from "./actions";
import { ObrasAdmin } from "@/components/admin/ObrasAdmin";
import { ESTADOS_OBRA, ESTADO_OBRA_LABELS, type EstadoObraLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ObrasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; cliente?: string }>;
}) {
  const { estado, cliente } = await searchParams;
  const [obras, clientes, contratos] = await Promise.all([
    getObras(),
    getClientesParaObra(),
    getContratosParaObra(),
  ]);

  const filtroEstado = ESTADOS_OBRA.includes(estado as EstadoObraLabel)
    ? (estado as EstadoObraLabel)
    : undefined;

  // §8.2: filtro por cliente que hace funcionar "Ver obras" desde Usuario.
  const clienteFiltrado = cliente
    ? clientes.find((c) => c.id === cliente) ?? null
    : null;

  const visibles = obras.filter((o) => {
    if (filtroEstado && o.estado !== filtroEstado) return false;
    if (clienteFiltrado && o.clienteId !== clienteFiltrado.id) return false;
    return true;
  });

  const hayFiltro = Boolean(filtroEstado || clienteFiltrado);

  // Construye un href de obras conservando los filtros activos.
  function hrefObras(override: { estado?: string; cliente?: string }) {
    const params = new URLSearchParams();
    const nextEstado = "estado" in override ? override.estado : estado;
    const nextCliente = "cliente" in override ? override.cliente : cliente;
    if (nextEstado) params.set("estado", nextEstado);
    if (nextCliente) params.set("cliente", nextCliente);
    const qs = params.toString();
    return `/admin/obras${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Obras</h1>
          <p className="mt-1 text-ink-muted">Obras activas y entregadas, con hitos y pagos</p>
        </div>
      </div>

      {/* §8.2: el filtro debe ser visible y removible, y explicar
          por qué la lista está reducida. */}
      {hayFiltro && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-border bg-surface px-4 py-3 text-sm">
          <span className="text-ink-muted">
            Filtro activo:
            {clienteFiltrado && (
              <>
                {" "}
                cliente <strong>{clienteFiltrado.nombre} {clienteFiltrado.apellidos}</strong>
              </>
            )}
            {clienteFiltrado && filtroEstado && " · "}
            {filtroEstado && (
              <>
                {" "}
                estado <strong>{ESTADO_OBRA_LABELS[filtroEstado]}</strong>
              </>
            )}{" "}
            ({visibles.length})
          </span>
          {clienteFiltrado && (
            <Link
              href={hrefObras({ cliente: "" })}
              className="text-accent-strong hover:underline"
            >
              Quitar filtro de cliente
            </Link>
          )}
          {filtroEstado && (
            <Link
              href={hrefObras({ estado: "" })}
              className="text-accent-strong hover:underline"
            >
              Quitar filtro de estado
            </Link>
          )}
          <Link href="/admin/obras" className="text-ink-muted hover:underline">
            Ver todas
          </Link>
        </div>
      )}

      <div className="mt-8">
        <ObrasAdmin obras={visibles} clientes={clientes} contratos={contratos} />
      </div>
    </div>
  );
}
