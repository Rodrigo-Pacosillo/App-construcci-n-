import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getChatAccionesPendientes,
  getChatSesiones,
  confirmarChatAccion,
  rechazarChatAccion,
} from "./actions";
import { SesionesTabla } from "@/components/admin/SesionesTabla";

export default async function ChatAdminPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/");

  const [acciones, sesiones] = await Promise.all([
    getChatAccionesPendientes(),
    getChatSesiones(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Chat — Administración</h1>
          <p className="mt-1 text-ink-muted">
            Conversaciones y acciones pendientes de confirmación
          </p>
        </div>
      </div>

      {/* Acciones pendientes */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Acciones pendientes ({acciones.length})
        </h2>
        {acciones.length === 0 ? (
          <p className="text-ink-muted">No hay acciones pendientes.</p>
        ) : (
          <div className="rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Herramienta
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Sesión
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Solicitado por
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Creado
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {acciones.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {a.herramienta.replace("proponer_", "")}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {a.sesion.sessionId.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {a.usuario?.nombre ?? a.usuario?.email ?? "Desconocido"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(a.creadoEn).toLocaleString("es-BO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={async (fd: FormData) => {
                          await confirmarChatAccion(fd);
                        }}
                        className="inline mr-2"
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="text-xs bg-green-100 text-green-800 rounded px-2 py-1 hover:bg-green-200"
                        >
                          Confirmar
                        </button>
                      </form>
                      <form
                        action={async (fd: FormData) => {
                          await rechazarChatAccion(fd);
                        }}
                        className="inline"
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="text-xs bg-red-100 text-red-800 rounded px-2 py-1 hover:bg-red-200"
                        >
                          Rechazar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Conversaciones recientes */}
      <SesionesTabla
        sesiones={sesiones.map((s) => ({
          ...s,
          mensajes: s.mensajes.length,
        }))}
      />
    </div>
  );
}
