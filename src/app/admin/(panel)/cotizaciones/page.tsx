import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCotizaciones } from "./actions";
import { CotizacionesList } from "@/components/admin/CotizacionesList";

export default async function CotizacionesPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const cotizaciones = await getCotizaciones();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Cotizaciones</h1>
          <p className="mt-1 text-ink-muted">{cotizaciones.length} cotizaciones en total</p>
        </div>
      </div>

      <div className="mt-8">
        <CotizacionesList cotizaciones={cotizaciones as never} />
      </div>
    </div>
  );
}
