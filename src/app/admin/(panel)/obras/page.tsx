import { getObras, getClientesParaObra, getContratosParaObra } from "./actions";
import { ObrasAdmin } from "@/components/admin/ObrasAdmin";

export const dynamic = "force-dynamic";

export default async function ObrasAdminPage() {
  const [obras, clientes, contratos] = await Promise.all([
    getObras(),
    getClientesParaObra(),
    getContratosParaObra(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Obras</h1>
          <p className="mt-1 text-ink/50">Obras activas y entregadas, con hitos y pagos</p>
        </div>
      </div>

      <div className="mt-8">
        <ObrasAdmin obras={obras} clientes={clientes} contratos={contratos} />
      </div>
    </div>
  );
}