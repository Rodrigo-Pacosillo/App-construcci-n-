import { getClientes } from "./actions";
import { ClientesList } from "@/components/admin/ClientesList";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const clientes = await getClientes();

  return (
    <div>
      <div>
        <h1 className="font-heading text-3xl font-bold">Clientes</h1>
        <p className="mt-1 text-ink-muted">
          Fichas de personas/contacto. Un cliente puede existir sin cuenta de acceso.
        </p>
      </div>

      <div className="mt-8">
        <ClientesList clientes={clientes} />
      </div>
    </div>
  );
}
