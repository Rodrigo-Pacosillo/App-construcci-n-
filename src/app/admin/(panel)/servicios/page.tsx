import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getServicios } from "./actions";
import { ServiciosList } from "@/components/admin/ServiciosList";

export default async function ServiciosAdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const servicios = await getServicios();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Servicios</h1>
          <p className="mt-1 text-ink/50">{servicios.length} servicios en total</p>
        </div>
      </div>

      <div className="mt-8">
        <ServiciosList servicios={servicios as never} />
      </div>
    </div>
  );
}
