import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function getContratos() {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { cliente: true },
  });

  if (!usuario?.cliente) return [];

  return prisma.contrato.findMany({
    where: { clienteId: usuario.cliente.id },
    include: { cliente: true, cotizacion: true },
    orderBy: { fechaFirma: "desc" },
  });
}

export default async function ClientContratosPage() {
  const contratos = await getContratos();

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-2 text-ink/40">CONTRATOS</p>
        <h1 className="font-heading text-3xl font-bold">
          Mis contratos
        </h1>
      </div>

      {contratos.length === 0 ? (
        <p className="py-12 text-center text-ink/50">
          No tenés contratos activos.
        </p>
      ) : (
        <div className="space-y-4">
          {contratos.map((c) => (
            <div
              key={c.id}
              className="rounded border border-border bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label text-ink/40">CONTRATO</p>
                  <h2 className="mt-1 font-heading text-lg font-bold">
                    {c.cotizacion?.tipoObra.replace(/_/g, " ") || "Obra sin cotización"}
                  </h2>
                  <p className="mt-1 text-sm text-ink/50">
                    {c.fechaFirma
                      ? `Firmado el ${new Date(c.fechaFirma).toLocaleDateString("es-AR")}`
                      : "Fecha de firma no registrada"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="section-label text-accent-strong">Acordado</p>
                  <p className="mt-1 font-heading text-lg font-bold">
                    ${Number(c.montoTotal).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
