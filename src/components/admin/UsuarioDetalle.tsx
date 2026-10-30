"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ESTADO_LABELS, ESTADO_COLORES, ESTADO_OBRA_LABELS } from "@/lib/constants";
import { formatFecha, formatMonto } from "@/lib/format";
import { toggleUsuarioActivo } from "@/app/admin/(panel)/usuarios/actions";

type Usuario = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  activo: boolean;
  creadoEn: Date;
  clienteId: string | null;
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    email: string | null;
    ciudad: string | null;
    cotizaciones: {
      id: string;
      estado: string;
      tipoObra: string;
      creadoEn: Date;
      montoEstimado: number | null;
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
  } | null;
};

export function UsuarioDetalle({ usuario }: { usuario: Usuario }) {
  const c = usuario.cliente;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/usuarios"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            ← Volver a Usuarios
          </Link>
          <h1 className="font-heading text-3xl font-bold">
            {usuario.nombre} {usuario.apellidos}
          </h1>
          <p className="mt-1 text-ink-muted">{usuario.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variante={usuario.activo ? "success" : "danger"}>
            {usuario.activo ? "Cuenta activa" : "Cuenta suspendida"}
          </Badge>
          {/* §7.5: suspender/reactivar dentro de la ficha, con confirmación */}
          <ConfirmButton
            titulo={usuario.activo ? "Suspender cuenta" : "Reactivar cuenta"}
            mensaje={
              usuario.activo
                ? "Suspender impide que la persona inicie sesión, pero NO elimina su historial, contratos, cotizaciones ni obras. Puede reactivarla en cualquier momento."
                : "La cuenta podrá iniciar sesión nuevamente. El historial no se modifica."
            }
            textoConfirmar={usuario.activo ? "Suspender cuenta" : "Reactivar cuenta"}
            variante={usuario.activo ? "danger" : "neutral"}
            onConfirm={() => toggleUsuarioActivo(usuario.id, !usuario.activo)}
            className="inline-flex h-9 items-center justify-center rounded border border-border px-4 text-sm font-medium transition-colors hover:bg-ink/5"
          >
            {usuario.activo ? "Suspender cuenta" : "Reactivar cuenta"}
          </ConfirmButton>
        </div>
      </div>

      {/* Datos de la cuenta y del cliente (§7.3) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">DATOS DEL CLIENTE</p>
          {c ? (
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-faint">Nombre</dt>
                <dd className="text-right font-medium">{c.nombre} {c.apellidos}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-faint">Teléfono</dt>
                <dd className="text-right">{c.telefono}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-faint">Email</dt>
                <dd className="text-right">{c.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-faint">Ciudad</dt>
                <dd className="text-right">{c.ciudad ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Esta cuenta no tiene un cliente vinculado. La relación es opcional;
              vincúlela desde la administración sin asociar un cliente incorrecto.
            </p>
          )}
        </div>

        <div className="rounded border border-border bg-surface p-6">
          <p className="section-label text-ink-faint">DATOS DE LA CUENTA</p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Rol</dt>
              <dd className="text-right font-medium capitalize">{usuario.rol}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Estado</dt>
              <dd className="text-right">{usuario.activo ? "Activa" : "Suspendida"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-faint">Fecha de creación</dt>
              <dd className="text-right">{formatFecha(usuario.creadoEn)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Cotizaciones del cliente (§7.3) */}
      <section>
        <h2 className="font-heading text-xl font-bold">Cotizaciones</h2>
        {c && c.cotizaciones.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Tipo de obra</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Monto estimado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {c.cotizaciones.map((cot) => (
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
                    <td className="px-4 py-3">{formatMonto(cot.montoEstimado)}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatFecha(cot.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Sin cotizaciones registradas.</p>
        )}
      </section>

      {/* Contratos del cliente (§7.3) */}
      <section>
        <h2 className="font-heading text-xl font-bold">Contratos</h2>
        {c && c.contratos.length > 0 ? (
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
                {c.contratos.map((k) => (
                  <tr key={k.id}>
                    <td className="px-4 py-3 font-medium">{formatMonto(k.montoTotal)}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {k.fechaFirma ? formatFecha(k.fechaFirma) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatFecha(k.creadoEn)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/contratos/${k.id}`}
                        className="inline-flex h-8 items-center justify-center rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
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

      {/* Obras del cliente (§7.3 / §7.4) */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Obras</h2>
          {c && c.obras.length > 0 && (
            <Link
              href={`/admin/obras?cliente=${c.id}`}
              className="text-sm text-accent-strong hover:underline"
            >
              Ver obras filtradas →
            </Link>
          )}
        </div>
        {c && c.obras.length > 0 ? (
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
                {c.obras.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">{o.direccionObra}</td>
                    <td className="px-4 py-3">
                      {ESTADO_OBRA_LABELS[o.estado as keyof typeof ESTADO_OBRA_LABELS] ?? o.estado}
                    </td>
                    <td className="px-4 py-3">{o.progreso}%</td>
                    <td className="px-4 py-3 text-ink-muted">{formatFecha(o.fechaInicio)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/obras/${o.id}`}
                        className="inline-flex h-8 items-center justify-center rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
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
