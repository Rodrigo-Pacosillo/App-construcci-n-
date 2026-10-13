import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function getObraActiva() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      cliente: {
        include: {
          obras: {
            include: {
              contrato: true,
            },
            orderBy: { fechaInicio: "desc" },
          },
        },
      },
    },
  });

  const obras = usuario?.cliente?.obras ?? [];
  return obras[0] || null;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ClienteDocumentosPage() {
  const obra = await getObraActiva();

  if (!obra) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">DOCUMENTOS</p>
        <p className="mt-4 text-ink-muted">
          No tenés una obra activa registrada.
        </p>
      </div>
    );
  }

  const contrato = obra.contrato;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink-faint">DOCUMENTOS</p>
        <h1 className="font-heading text-3xl font-bold">{obra.direccionObra}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Aquí encontrarás la documentación contractual y legal de tu obra.
        </p>
      </div>

      <div className="rounded border border-border bg-surface p-6">
        {contrato ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="section-label text-ink-faint">CONTRATO PRINCIPAL</p>
                <h3 className="mt-1 font-heading text-lg font-bold">Contrato de obra #{contrato.id.slice(0, 8)}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Firmado el {formatDate(contrato.fechaFirma)} · Monto: ${Number(contrato.montoTotal).toLocaleString("es-AR")}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="accent-btn rounded px-4 py-2 text-sm font-medium">
                  Descargar PDF
                </button>
                <button className="rounded px-4 py-2 text-sm font-medium bg-ink/5 text-ink hover:bg-ink/10">
                  Ver online
                </button>
              </div>
            </div>

            {contrato.archivoPdfUrl && (
              <p className="mt-4 text-sm text-green-600">
                ✓ PDF disponible en: {contrato.archivoPdfUrl}
              </p>
            )}

            {!contrato.archivoPdfUrl && (
              <p className="mt-4 text-sm text-amber-600">
                ⚠ PDF no subido aún. Contactá al administrador para obtener tu contrato firmado.
              </p>
            )}

            {contrato.observaciones && (
              <div className="mt-6 p-4 rounded bg-ink/5 border border-border">
                <p className="section-label text-ink-faint">OBSERVACIONES DEL CONTRATO</p>
                <p className="mt-1 text-sm text-ink-muted">{contrato.observaciones}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="section-label text-ink-faint">SIN CONTRATO VINCULADO</p>
            <p className="mt-2 text-ink-muted">
              Esta obra no tiene un contrato registrado en el sistema.
            </p>
          </div>
        )}
      </div>

      <div className="rounded border border-border bg-surface p-6">
        <p className="section-label mb-4 text-ink-faint">OTROS DOCUMENTOS</p>
        <div className="space-y-2 text-sm text-ink-muted">
          <p>• Planos y especificaciones técnicas (pendiente)</p>
          <p>• Certificados de avance (pendiente)</p>
          <p>• Actas de recepción (pendiente)</p>
          <p>• Garantías y seguros (pendiente)</p>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          Los documentos adicionales se irán agregando conforme avance la obra.
        </p>
      </div>
    </div>
  );
}