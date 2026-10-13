import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

async function getCliente(clienteId: string) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");

  return prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      cotizaciones: { orderBy: { creadoEn: "desc" }, take: 3 },
      obras: { orderBy: { fechaInicio: "desc" }, take: 1 },
    },
  });
}

export default async function AdminCrearCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; error?: string; success?: string; email?: string; nombre?: string; apellidos?: string; password?: string }>;
}) {
  const { clienteId, error, success, email, nombre, apellidos } = await searchParams;

  if (!clienteId) {
    redirect("/admin/autorizar-cuentas");
  }

  const cliente = await getCliente(clienteId);

  if (!cliente) {
    redirect("/admin/autorizar-cuentas");
  }

  const tieneObras = cliente.obras.length > 0;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/autorizar-cuentas"
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-4"
        >
          ← Volver a autorizar cuentas
        </Link>
        <h1 className="font-heading text-3xl font-bold">Crear cuenta de acceso</h1>
        <p className="mt-2 text-ink-muted">
          Cliente: <span className="font-medium">{cliente.nombre} {cliente.apellidos}</span>
        </p>
      </div>

      <div className="rounded border border-border bg-surface p-6 space-y-6">
        {success && (
          <div className="rounded bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="rounded bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="rounded border border-border bg-background p-4">
          <p className="section-label text-ink-faint">DATOS DEL CLIENTE</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
            <div><span className="text-ink-faint">Teléfono:</span> <span className="ml-2">{cliente.telefono}</span></div>
            <div><span className="text-ink-faint">Email:</span> <span className="ml-2">{cliente.email || "—"}</span></div>
            <div><span className="text-ink-faint">Ciudad:</span> <span className="ml-2">{cliente.ciudad || "—"}</span></div>
            <div>
              <span className="text-ink-faint">Situación:</span>{" "}
              <span className="ml-2 font-medium">
                {tieneObras ? "Con obra activa" : cliente.cotizaciones.length > 0 ? "En negociación" : "Sin actividad"}
              </span>
            </div>
          </div>
        </div>

        <form action={async (formData) => { "use server"; const { createUsuarioCliente } = await import("../actions"); await createUsuarioCliente(formData); }} className="space-y-6">
          <input type="hidden" name="clienteId" value={clienteId} />

          <div>
            <label htmlFor="email" className="section-label block text-ink-faint">
              Email para la cuenta <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={email || cliente.email || ""}
              className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="cliente@email.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="section-label block text-ink-faint">
                Nombre(s) <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={nombre || cliente.nombre}
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="apellidos" className="section-label block text-ink-faint">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                required
                defaultValue={apellidos || cliente.apellidos}
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="section-label block text-ink-faint">
              Contraseña temporal <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="Mínimo 8 caracteres"
            />
            <p className="mt-1 text-xs text-ink-faint">
              El cliente deberá cambiarla en su primer acceso.
            </p>
          </div>

          <div className="rounded bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Se creará un usuario con rol <code className="px-1 bg-amber-100 rounded">cliente</code>
              vinculado a este cliente. El cliente recibirá las credenciales por WhatsApp/email fuera del sistema.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              className="accent-btn flex-1 rounded py-2 text-sm font-medium"
            >
              Crear cuenta y vincular
            </button>
            <Link
              href="/admin/autorizar-cuentas"
              className="flex-1 rounded bg-ink/5 py-2 text-sm font-medium text-center text-ink hover:bg-ink/10"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}