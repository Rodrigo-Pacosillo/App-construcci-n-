"use client";

import Link from "next/link";
import { FileText, Mail, Users } from "lucide-react";

type ContratoDisplay = {
  id: string;
  montoTotal: number;
  creadoEn: Date;
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string | null;
    usuario?: { id: string } | null;
  } | null;
  cotizacion: { tipoObra: string; estado: string } | null;
  obras: { id: string; direccionObra: string }[];
};

export function ContratosList({ contratos }: { contratos: ContratoDisplay[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Contratos</h1>
          <p className="mt-1 text-ink-muted">
            {contratos.length === 1
              ? "1 contrato en total"
              : `${contratos.length} contratos en total`}
          </p>
        </div>
        <Link
          href="/admin/contratos/new"
          className="accent-btn inline-flex h-9 items-center justify-center rounded px-4 text-sm font-medium"
        >
          Nuevo contrato
        </Link>
      </div>

      <div className="mt-8">
        <div className="rounded border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 section-label text-ink-faint">Cliente</th>
                  <th className="hidden px-4 py-3 section-label text-ink-faint md:table-cell">
                    Obra vinculada
                  </th>
                  <th className="px-4 py-3 section-label text-ink-faint">Monto total</th>
                  <th className="px-4 py-3 text-right section-label text-ink-faint">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((contrato) => {
                  const cliente = contrato.cliente;
                  const obra = contrato.obras?.[0];
                  const tieneUsuario = Boolean(cliente?.usuario?.id);
                  const usuarioId = cliente?.usuario?.id;
                  const nombre = cliente ? `${cliente.nombre} ${cliente.apellidos}`.trim() : "—";

                  return (
                    <tr
                      key={contrato.id}
                      className="border-b border-border last:border-0 hover:bg-ink/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{nombre}</p>
                        <p className="text-xs text-ink-faint">{cliente?.email || "Sin email"}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                        {obra?.direccionObra || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink">
                        ${contrato.montoTotal.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
                          <Link
                            href={`/admin/contratos/${contrato.id}`}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Ver
                          </Link>
                          {tieneUsuario && usuarioId ? (
                            <Link
                              href={`/admin/usuarios/${usuarioId}`}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                            >
                              <Users className="h-3.5 w-3.5" />
                              Usuario existente
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/contratos/${contrato.id}?created=1`}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-ink/5"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Invitar al portal
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {contratos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-ink-faint">
                      No hay contratos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
