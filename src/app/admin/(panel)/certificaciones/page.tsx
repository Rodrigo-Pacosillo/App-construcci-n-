import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCertificaciones } from "./actions";
import { CertificacionesList } from "@/components/admin/CertificacionesList";

export default async function CertificacionesAdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const certificaciones = await getCertificaciones();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Certificaciones</h1>
          <p className="mt-1 text-ink-muted">
            {certificaciones.length} certificaciones en total
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CertificacionesList certificaciones={certificaciones as never} />
      </div>
    </div>
  );
}