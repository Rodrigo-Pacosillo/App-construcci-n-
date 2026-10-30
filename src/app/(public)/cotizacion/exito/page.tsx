import { prisma } from "@/lib/db";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { WHATSAPP_NUMERO } from "@/lib/constants";

const TIPO_OBRA_SHORT: Record<string, string> = {
  vivienda_nueva: "Vivienda nueva",
  ampliacion: "Ampliación / Refacción",
  otro: "Otro",
};

const TIPO_CONSTRUCCION_SHORT: Record<string, string> = {
  tradicional: "Tradicional",
  seco: "Steel Frame",
  no_sabe: "No definido",
  integral: "Integral",
};

const RANGO_M2_SHORT: Record<string, string> = {
  hasta_50: "Hasta 50 m²",
  m50_100: "50 - 100 m²",
  m100_200: "100 - 200 m²",
  mas_200: "Más de 200 m²",
};

const PLAZO_INICIO_SHORT: Record<string, string> = {
  lo_antes_posible: "Lo antes posible",
  en_1_mes: "En 1 mes",
  en_3_meses: "En 3 meses",
  en_6_meses: "En 6 meses",
  no_sabe: "Aún no definido",
};

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; cotizacionId?: string }>;
}) {
  const { clienteId, cotizacionId } = await searchParams;

  if (!clienteId || !cotizacionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Datos incompletos
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            No se recibieron los identificadores de cliente y cotización.
          </p>
        </div>
      </div>
    );
  }

  const [cliente, cotizacion] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nombre: true },
    }),
    prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      select: {
        id: true,
        tipoObra: true,
        tipoConstruccion: true,
        rangoM2: true,
        plazoInicio: true,
        ubicacionObra: true,
      },
    }),
  ]);

  if (!cliente || !cotizacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            No se encontró la cotización
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Los datos proporcionados no coinciden con ningún registro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Columna izquierda: mensaje de éxito y resumen */}
          <div className="lg:col-span-1">
            <div className="text-center lg:text-left mb-8">
              <div className="inline-flex items-center justify-center lg:justify-start w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                Su solicitud fue enviada
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-none lg:max-w-md">
                Nos comunicaremos con usted en menos de 24 horas para coordinar
                una visita técnica.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-6">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">
                Resumen de su cotización
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Tipo de obra
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {TIPO_OBRA_SHORT[cotizacion.tipoObra] ?? cotizacion.tipoObra}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Tipo de construcción
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {TIPO_CONSTRUCCION_SHORT[cotizacion.tipoConstruccion] ?? cotizacion.tipoConstruccion}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Superficie
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {RANGO_M2_SHORT[cotizacion.rangoM2] ?? cotizacion.rangoM2}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Ubicación
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {cotizacion.ubicacionObra ?? "No especificada"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Plazo de inicio
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {PLAZO_INICIO_SHORT[cotizacion.plazoInicio] ?? cotizacion.plazoInicio}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: panel de chat */}
          <div className="lg:col-span-1">
            <ChatPanel
              clienteId={cliente.id}
              cotizacionId={cotizacion.id}
              clienteNombre={cliente.nombre}
              whatsappNumero={WHATSAPP_NUMERO}
              cotizacionData={{
                tipoObra: cotizacion.tipoObra,
                tipoConstruccion: cotizacion.tipoConstruccion,
                rangoM2: cotizacion.rangoM2,
                plazoInicio: cotizacion.plazoInicio,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
