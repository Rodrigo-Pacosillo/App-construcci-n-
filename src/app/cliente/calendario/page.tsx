import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { elegirObraPorDefecto } from "@/lib/obra-default";
import { CalendarioGrid } from "./CalendarioGrid";
import ObraSelector from "@/components/cliente/ObraSelector";

async function getDatos(obraId?: string) {
  const session = await auth();
  if (!session || session.user.role !== "cliente") redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: {
      cliente: {
        include: {
          obras: {
            include: {
              eventosCalendario: {
                where: { visibleCliente: true },
                orderBy: { fechaInicio: "asc" },
              },
            },
            orderBy: { fechaInicio: "desc" },
          },
        },
      },
    },
  });

  const obras = usuario?.cliente?.obras ?? [];
  const obra = elegirObraPorDefecto(obras, obraId);
  return { obras, obra };
}

export default async function ClienteCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ obraId?: string }>;
}) {
  const { obraId } = await searchParams;
  const { obras, obra } = await getDatos(obraId);

  if (!obra) {
    return (
      <div className="py-12 text-center">
        <p className="section-label text-ink-faint">CALENDARIO DE OBRA</p>
        <p className="mt-4 text-ink-muted">
          No tiene una obra activa registrada.
        </p>
      </div>
    );
  }

  const eventos = obra.eventosCalendario.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    descripcion: e.descripcion ?? undefined,
    tipo: e.tipo,
    fechaInicio: e.fechaInicio.toISOString(),
    fechaFin: e.fechaFin?.toISOString() ?? null,
    todoElDia: e.todoElDia,
  }));

  return (
    <div className="space-y-6">
      <ObraSelector
        obras={obras.map((o) => ({
          id: o.id,
          direccionObra: o.direccionObra,
          estado: o.estado,
        }))}
        obraId={obra.id}
      />
      <CalendarioGrid
        eventos={eventos}
        obra={{ id: obra.id, direccionObra: obra.direccionObra }}
      />
    </div>
  );
}
