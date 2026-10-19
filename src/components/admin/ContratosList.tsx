"use client";

import Link from "next/link";
import { useState } from "react";

type Contrato = {
  id: string;
  montoTotal: number;
  fechaFirma: Date | null;
  creadoEn: Date;
  cliente: { nombre: string; apellidos: string; email: string | null } | null;
  cotizacion: { tipoObra: string; estado: string } | null;
  obras: { id: string; direccionObra: string }[];
};

export function ContratosList({ contratos }: { contratos: Contrato[] }) {
  const [search, setSearch] = useState("");

  const filtrados = contratos.filter((c) =>
    c.cliente?.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.cliente?.apellidos.toLowerCase().includes(search.toLowerCase()) ||
    c.cotizacion?.tipoObra.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1 text-ink-faint">CONTRATOS</p>
          <h1 className="font-heading text-3xl font-bold">Listado de contratos</h1>
        </div>
        <Link
          href="/admin/contratos/new"
          className="accent-btn rounded px-4 py-2 text-sm font-medium"
        >
          Nuevo contrato
        </Link>
      </div>

      <div className="rounded border border-border bg-surface">
        <div className="p-4 border-b border-border">
          <input
            type="search"
            placeholder="Buscar por cliente, tipo de obra, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink-faint">ID</th>
                <th className="px-4 py-3 section-label text-ink-faint">Cliente</th>
                <th className="px-4 py-3 section-label text-ink-faint">Cotización origen</th>
                <th className="px-4 py-3 section-label text-ink-faint">Obra vinculada</th>
                <th className="px-4 py-3 section-label text-ink-faint">Monto total</th>
                <th className="px-4 py-3 section-label text-ink-faint">Fecha firma</th>
                <th className="px-4 py-3 section-label text-ink-faint">Creado</th>
                <th className="px-4 py-3 section-label text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{c.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.cliente?.nombre || "—"} {c.cliente?.apellidos || ""}</p>
                    {c.cliente?.email && <p className="text-xs text-ink-muted">{c.cliente.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {c.cotizacion ? (
                      <>
                        <p className="capitalize text-ink-muted">{c.cotizacion.tipoObra.replace("_", " ")}</p>
                        <p className="text-xs text-ink-faint">{c.cotizacion.estado}</p>
                      </>
                    ) : (
                      <p className="text-ink-faint">— Sin cotización —</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.obras.length > 0 ? (
                      <ul className="space-y-1">
                        {c.obras.map((o) => (
                          <li key={o.id} className="text-xs text-ink-muted">{o.direccionObra}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-ink-faint">— Sin obra —</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-heading font-bold text-accent-strong">
                    ${Number(c.montoTotal).toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {c.fechaFirma
                      ? new Date(c.fechaFirma).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(c.creadoEn).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/contratos/${c.id}`}
                      className="text-xs text-accent-strong hover:underline"
                    >
                      Ver / Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">
                    No hay contratos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}