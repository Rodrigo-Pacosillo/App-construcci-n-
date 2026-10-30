import { prisma } from "@/lib/db";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { WHATSAPP_NUMERO } from "@/lib/constants";

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
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
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
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            Nos comunicaremos con usted en menos de 24 horas para coordinar
            una visita técnica.
          </p>
        </div>

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
  );
}
