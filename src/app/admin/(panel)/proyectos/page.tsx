import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProyectos } from "./actions";
import { ProyectosList } from "@/components/admin/ProyectosList";

export default async function ProyectosAdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const proyectos = await getProyectos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Proyectos</h1>
          <p className="mt-1 text-ink-muted">{proyectos.length} proyectos en total</p>
        </div>
      </div>

      <div className="mt-8">
        <ProyectosList proyectos={proyectos as never} />
      </div>
    </div>
  );
}
