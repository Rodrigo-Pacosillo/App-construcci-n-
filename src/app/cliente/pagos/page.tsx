import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckCircle, Clock } from "lucide-react";

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
              pagos: { orderBy: { fecha: "desc" } },
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

export default async function ClientePagosPage() {
  const obra = await getObraActiva();

  if (!obra) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">HISTORIAL DE PAGOS</p>
        <p className="mt-4 text-ink-muted">
          No tenés una obra activa registrada.
        </p>
      </div>
    );
  }

  const pagos = obra.pagos;
  const contrato = obra.contrato;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-label mb-2 text-ink-faint">HISTORIAL DE PAGOS</p>
        <h1 className="font-heading text-3xl font-bold">{obra.direccionObra}</h1>
        {contrato && (
          <p className="mt-2 text-sm text-ink-muted">
            Monto contractual: <span className="font-bold text-accent-strong">${Number(contrato.montoTotal).toLocaleString("es-AR")}</span>
          </p>
        )}
      </div>

      {pagos.length > 0 ? (
        <div className="space-y-4">
          <p className="section-label text-ink-faint">PAGOS REGISTRADOS ({pagos.length})</p>
          <div className="space-y-3">
            {pagos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-heading font-medium">{p.concepto}</p>
                  <p className="text-sm text-ink-muted">{formatDate(p.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-lg font-bold">
                    ${Number(p.monto).toLocaleString("es-AR")}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                    {p.estado === "confirmado" ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Confirmado
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Registrado
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded border border-border bg-surface p-8 text-center">
          <p className="section-label text-ink-faint">SIN PAGOS REGISTRADOS</p>
          <p className="mt-2 text-ink-muted">
            Los pagos aparecerán aquí conforme se registren.
          </p>
        </div>
      )}
    </div>
  );
}