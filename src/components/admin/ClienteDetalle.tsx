"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ESTADO_LABELS, ESTADO_COLORES, ESTADO_OBRA_LABELS } from "@/lib/constants";
import { formatFecha, formatMonto } from "@/lib/format";

type Cliente = {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string | null;
  ciudad: string | null;
  creadoEn: Date;
  usuario: { id: string; email: string; activo: boolean } | null;
  cotizaciones: {
    id: string;
    estado: string;
    tipoObra: string;
    creadoEn: Date;
    montoCerrado: number | null;
  }[];
  contratos: {
    id: string;
    montoTotal: number;
    fechaFirma: Date | null;
    creadoEn: Date;
  }[];
  obras: {
    id: string;
    direccionObra: string;
    estado: string;
    progreso: number;
    fechaInicio: Date;
  }[];
};

export function ClienteDetalle({ cliente }: { cliente: Cliente }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/clientes"
            className="mb-2 inline-block text-sm text-ink-muted hover:text-ink"
          >
            ← Volver a Clientes
          </Link>
          <h1 className="font-heading text-3xl font-bold">
            {cliente.nombre} {cliente.apellidos}
          </h1>
          <p className="mt-1 text-ink-muted">
            Ficha de persona/contacto vinculada al negocio
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cliente.usuario ? (
            <>
              <Badge variante={cliente.usuario.activo ? "success" : "danger"}>
                {cliente.usuario.activo ? "Cuenta activa" : "Cuenta suspendida"}
              </Badge>
              <Link
                href={`/admin/usuarios/${cliente.usuario.id}`}
                className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
              >
                Ver cuenta de usuario
              </Link>
            </>
          ) : (
            <Link
              href={`/admin/autorizar-cuentas/crear?clienteId=${cliente.id}&nombre=${encodeURIComponent(cliente.nombre)}&apellidos=${encodeURIComponent(cliente.apellidos)}${cliente.email ? `&email=${encodeURIComponent(cliente.email)}` : ""}`}
              className="accent-btn rounded px-4 py-2 text-sm font-medium"
            >
              Autorizar cuenta
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">DATOS DE CONTACTO</p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Teléfono</dt>
              <dd className="text-right">{cliente.telefono}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Email</dt>
              <dd className="text-right">{cliente.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Ciudad</dt>
              <dd className="text-right">{cliente.ciudad ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Registrado</dt>
              <dd className="text-right">{formatFecha(cliente.creadoEn)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">RELACIÓN</p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Cotizaciones</dt>
              <dd className="text-right">{cliente.cotizaciones.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Contratos</dt>
              <dd className="text-right">{cliente.contratos.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Obras</dt>
              <dd className="text-right">{cliente.obras.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Acceso al portal</dt>
              <dd className="text-right">
                {cliente.usuario
                  ? cliente.usuario.activo
                    ? "Sí (activo)"
                    : "Sí (suspendido)"
                  : "No"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section>
        <h2 className="font-heading text-xl font-bold">Cotizaciones</h2>
        {cliente.cotizaciones.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Tipo de obra</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Monto cerrado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cliente.cotizaciones.map((cot) => (
                  <tr key={cot.id}>
                    <td className="px-4 py-3 capitalize">
                      {cot.tipoObra.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                          ESTADO_COLORES[cot.estado as keyof typeof ESTADO_COLORES] ??
                          "bg-ink/5 text-ink-muted"
                        }`}
                      >
                        {ESTADO_LABELS[cot.estado as keyof typeof ESTADO_LABELS] ?? cot.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatMonto(cot.montoCerrado)}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatFecha(cot.creadoEn)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/cotizaciones/${cot.id}`}
                        className="text-accent-strong hover:underline"
                      >
                        Ver cotización
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Sin cotizaciones registradas.</p>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl font-bold">Contratos</h2>
        {cliente.contratos.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Monto total</th>
                  <th className="px-4 py-3 font-medium">Fecha de firma</th>
                  <th className="px-4 py-3 font-medium">Registrado</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cliente.contratos.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-3 font-medium">{formatMonto(k.montoTotal)}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {k.fechaFirma ? formatFecha(k.fechaFirma) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatFecha(k.creadoEn)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/contratos/${k.id}`}
                        className="text-accent-strong hover:underline"
                      >
                        Ver contrato
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Sin contratos registrados.</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Obras</h2>
          {cliente.obras.length > 0 && (
            <Link
              href={`/admin/obras?cliente=${cliente.id}`}
              className="text-sm text-accent-strong hover:underline"
            >
              Ver obras filtradas →
            </Link>
          )}
        </div>
        {cliente.obras.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Dirección</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Progreso</th>
                  <th className="px-4 py-3 font-medium">Inicio</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cliente.obras.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">{o.direccionObra}</td>
                    <td className="px-4 py-3">
                      {ESTADO_OBRA_LABELS[o.estado as keyof typeof ESTADO_OBRA_LABELS] ?? o.estado}
                    </td>
                    <td className="px-4 py-3">{o.progreso}%</td>
                    <td className="px-4 py-3 text-ink-muted">{formatFecha(o.fechaInicio)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/obras/${o.id}`}
                        className="text-accent-strong hover:underline"
                      >
                        Ver obra
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Sin obras registradas.</p>
        )}
      </section>
    </div>
  );
}
