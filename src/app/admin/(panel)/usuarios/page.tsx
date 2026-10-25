import { getUsuarios } from "./actions";
import { UsuariosList } from "@/components/admin/UsuariosList";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const usuarios = await getUsuarios();

  return (
    <div>
      <div>
        <h1 className="font-heading text-3xl font-bold">Usuarios</h1>
        <p className="mt-1 text-ink-muted">
          Cuentas de acceso al portal. Un prospecto sin cuenta no aparece aquí.
        </p>
      </div>

      <div className="mt-8">
        <UsuariosList usuarios={usuarios} />
      </div>
    </div>
  );
}
