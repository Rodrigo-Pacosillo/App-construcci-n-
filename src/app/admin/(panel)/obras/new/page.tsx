import Link from "next/link";
import { getClientesParaObra, getContratosParaObra } from "../actions";
import { ObraForm } from "@/components/admin/ObraForm";

export const dynamic = "force-dynamic";

export default async function AdminNuevaObraPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; contratoId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const [clientes, contratos] = await Promise.all([
    getClientesParaObra(),
    getContratosParaObra(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/obras"
          className="mb-2 inline-block text-sm text-ink-muted hover:text-ink"
        >
          ← Volver a Obras
        </Link>
        <h1 className="font-heading text-3xl font-bold">Nueva obra</h1>
        <p className="mt-1 text-ink-muted">
          Registre una obra para un cliente existente. Puede vincularla a un contrato
          si ya existe.
        </p>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded border border-border bg-surface p-12 text-center">
          <p className="section-label text-ink-faint">SIN CLIENTES</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Para crear una obra primero debe existir una ficha de cliente. Las fichas
            se generan desde las cotizaciones o los contratos.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin/cotizaciones"
              className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
            >
              Ir a Cotizaciones
            </Link>
            <Link
              href="/admin/contratos"
              className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
            >
              Ir a Contratos
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <ObraForm
            clientes={clientes}
            contratos={contratos}
            clienteIdInicial={clienteId}
          />
        </div>
      )}
    </div>
  );
}
