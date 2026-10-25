"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, DataTableHead, DataTableEmpty } from "@/components/ui/DataTable";
import { formatFecha } from "@/lib/format";

type Usuario = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  activo: boolean;
  creadoEn: Date;
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    email: string | null;
    ciudad: string | null;
    obras: { id: string; estado: string }[];
  } | null;
};

export function UsuariosList({ usuarios }: { usuarios: Usuario[] }) {
  const [search, setSearch] = useState("");

  // §7.2: búsqueda por nombre/apellidos y teléfono del cliente relacionado.
  const q = search.trim().toLowerCase();
  const filtrados = q
    ? usuarios.filter((u) => {
        const campos = [
          u.nombre,
          u.apellidos,
          u.email,
          u.cliente?.nombre,
          u.cliente?.apellidos,
          u.cliente?.telefono,
        ];
        return campos.some((c) => c?.toLowerCase().includes(q));
      })
    : usuarios;

  if (usuarios.length === 0) {
    return (
      <EmptyState
        titulo="Todavía no hay cuentas de usuario"
        descripcion="Las cuentas se crean desde el flujo de contratos o desde Autorizar cuentas. Un prospecto sin cuenta no aparece en esta lista."
        accion={
          <Link
            href="/admin/autorizar-cuentas"
            className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
          >
            Ir a Autorizar cuentas
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre o teléfono..."
      />

      <DataTable>
        <DataTableHead>
          <tr>
            <th className="px-4 py-3 font-medium">Cuenta</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Obras</th>
            <th className="px-4 py-3 font-medium">Creada</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </DataTableHead>
        <tbody className="divide-y divide-border">
          {filtrados.map((u) => (
            <tr key={u.id} className="hover:bg-ink/[0.02]">
              <td className="px-4 py-3">
                <p className="font-medium">
                  {u.nombre} {u.apellidos}
                </p>
                <p className="text-xs text-ink-muted">{u.email}</p>
              </td>
              <td className="px-4 py-3">
                {u.cliente ? (
                  <>
                    <p>{u.cliente.nombre} {u.cliente.apellidos}</p>
                    {u.cliente.ciudad && (
                      <p className="text-xs text-ink-muted">{u.cliente.ciudad}</p>
                    )}
                  </>
                ) : (
                  <span className="text-ink-faint">Sin cliente vinculado</span>
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {u.cliente?.telefono ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variante={u.activo ? "success" : "danger"}>
                  {u.activo ? "Activa" : "Suspendida"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {u.cliente?.obras.length ?? 0}
              </td>
              <td className="px-4 py-3 text-ink-muted">{formatFecha(u.creadoEn)}</td>
              <td className="px-4 py-3">
                {/* §7.2: dos acciones claras por fila */}
                <div className="flex gap-3 text-sm">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="text-accent-strong hover:underline"
                  >
                    Ver información
                  </Link>
                  {u.cliente && (
                    <Link
                      href={`/admin/obras?cliente=${u.cliente.id}`}
                      className="text-ink-muted hover:underline"
                    >
                      Ver obras
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <DataTableEmpty colSpan={7}>
              Ninguna cuenta coincide con la búsqueda.
            </DataTableEmpty>
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
