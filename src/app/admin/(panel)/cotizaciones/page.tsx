import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCotizaciones } from "./actions";
import { CotizacionesList } from "@/components/admin/CotizacionesList";
import {
  ESTADOS_COTIZACION,
  ESTADOS_POR_GRUPO,
  type EstadoCotizacion,
  type GrupoCotizacion,
} from "@/lib/constants";

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  const { estado } = await searchParams;
  const estadoValido = ESTADOS_COTIZACION.includes(estado as EstadoCotizacion)
    ? (estado as EstadoCotizacion)
    : undefined;

  const filtroInicial = estadoValido
    ? (Object.keys(ESTADOS_POR_GRUPO) as GrupoCotizacion[]).find((grupo) =>
        ESTADOS_POR_GRUPO[grupo].includes(estadoValido)
      )
    : undefined;

  const cotizaciones = await getCotizaciones();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Cotizaciones</h1>
          <p className="mt-1 text-ink-muted">
            {cotizaciones.length === 1
              ? "1 cotización en total"
              : `${cotizaciones.length} cotizaciones en total`}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <CotizacionesList
          cotizaciones={cotizaciones}
          filtroInicial={filtroInicial}
        />
      </div>
    </div>
  );
}
