import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

async function getClientesSinUsuario() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  return prisma.cliente.findMany({
    where: {
      usuario: null,
    },
    include: {
      cotizaciones: {
        orderBy: { creadoEn: "desc" },
        take: 1,
      },
      obras: {
        orderBy: { fechaInicio: "desc" },
        take: 1,
      },
    },
    orderBy: { creadoEn: "desc" },
  });
}

export default async function AdminAutorizarCuentasPage() {
  const clientes = await getClientesSinUsuario();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Autorizar cuentas</h1>
        <p className="mt-2 text-ink-muted">
          Lista de clientes que tienen cotizaciones u obras pero no tienen cuenta de acceso al portal.
          Crea una cuenta para que puedan ver el avance de su obra, pagos y documentos.
        </p>
      </div>

      <div className="rounded border border-border bg-surface">
        {clientes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="section-label text-ink-faint">SIN CLIENTES PENDIENTES</p>
            <p className="mt-2 text-ink-muted">
              Todos los clientes con cotizaciones u obras ya tienen cuenta de acceso.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink-faint">Cliente</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Contacto</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Ciudad</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Situación</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Registrado</th>
                  <th className="px-4 py-3 section-label text-ink-faint">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => {
                  const tieneCotizaciones = c.cotizaciones.length > 0;
                  const tieneObras = c.obras.length > 0;
                  let situacion = "Sin actividad";
                  if (tieneObras) situacion = "Con obra activa";
                  else if (tieneCotizaciones) situacion = "En negociación";

                  return (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.nombre} {c.apellidos}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{c.telefono}</p>
                        {c.email && <p className="text-xs text-ink-faint">{c.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{c.ciudad || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          tieneObras ? "bg-green-100 text-green-800" :
                          tieneCotizaciones ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {situacion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-faint">
                        {new Date(c.creadoEn).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/autorizar-cuentas/crear?clienteId=${c.id}`}
                          className="accent-btn inline-block rounded px-4 py-1.5 text-xs font-medium"
                        >
                          Crear cuenta
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}