"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Hammer } from "lucide-react";
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
            className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-ink/5"
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
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Obras</th>
            <th className="px-4 py-3 font-medium">Creada</th>
            <th className="px-4 py-3 text-right font-medium">Acciones</th>
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
                {u.cliente?.ciudad && (
                  <p className="text-xs text-ink-faint">{u.cliente.ciudad}</p>
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
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver información
                  </Link>
                  {u.cliente && (
                    <Link
                      href={`/admin/obras?cliente=${u.cliente.id}`}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      <Hammer className="h-3.5 w-3.5" />
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
