import { prisma } from "@/lib/db";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { WHATSAPP_NUMERO } from "@/lib/constants";
import { verificarChatToken } from "@/lib/tokens";
import { RestaurarSesionExito } from "./RestaurarSesionExito";
import { BotonNuevaCotizacion } from "./BotonNuevaCotizacion";

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

// Estado de cierre para casos excepcionales de token o registro.
// Siempre ofrece una salida hacia el formulario de cotización.
function Aviso({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {titulo}
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          {descripcion}
        </p>
        <div className="mt-8 flex justify-center">
          <BotonNuevaCotizacion />
        </div>
      </div>
    </div>
  );
}

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{
    cotizacionId?: string;
    t?: string;
    clienteId?: string;
  }>;
}) {
  const { cotizacionId, t } = await searchParams;

  // Sin parámetros en la URL: se intenta recuperar la conversación guardada
  // en el navegador antes de descartar la pantalla de éxito.
  if (!cotizacionId || !t) {
    return <RestaurarSesionExito motivo="sin_parametros" />;
  }

  // Verificar token HMAC
  let cotizacionIdVerificado: string;
  try {
    cotizacionIdVerificado = verificarChatToken(t).cotizacionId;
  } catch {
    return <RestaurarSesionExito motivo="token_invalido" />;
  }

  if (cotizacionIdVerificado !== cotizacionId) {
    return (
      <Aviso
        titulo="Token no coincide"
        descripcion="El token no pertenece a esta cotización."
      />
    );
  }

  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id: cotizacionId },
    select: {
      id: true,
      tipoObra: true,
      tipoConstruccion: true,
      rangoM2: true,
      plazoInicio: true,
      ubicacionObra: true,
      cliente: { select: { id: true, nombre: true } },
    },
  });

  if (!cotizacion || !cotizacion.cliente) {
    return (
      <Aviso
        titulo="No se encontró la cotización"
        descripcion="Los datos proporcionados no coinciden con ningún registro."
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8 items-start">
          <div className="lg:col-span-1">
            <div className="text-center lg:text-left mb-8">
              <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                ¿Desea cotizar otro proyecto?
              </p>
              <BotonNuevaCotizacion />
            </div>
          </div>

          <div className="lg:col-span-1 h-[70vh] min-h-[420px] lg:h-[620px]">
            <ChatPanel
              agente="publico"
              clienteId={cotizacion.cliente.id}
              cotizacionId={cotizacion.id}
              clienteNombre={cotizacion.cliente.nombre}
              whatsappNumero={WHATSAPP_NUMERO}
              chatToken={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
