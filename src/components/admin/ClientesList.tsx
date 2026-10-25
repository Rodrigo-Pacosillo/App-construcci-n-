"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, DataTableHead, DataTableEmpty } from "@/components/ui/DataTable";

type ClienteRow = {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string | null;
  ciudad: string | null;
  tieneCuenta: boolean;
  cuentaActiva: boolean | null;
  obrasActivas: number;
  totalObras: number;
  totalCotizaciones: number;
  totalContratos: number;
};

export function ClientesList({ clientes }: { clientes: ClienteRow[] }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter((c) =>
        [c.nombre, c.apellidos, c.telefono, c.email, c.ciudad].some((campo) =>
          campo?.toLowerCase().includes(q)
        )
      )
    : clientes;

  if (clientes.length === 0) {
    return (
      <EmptyState
        titulo="Todavía no hay fichas de cliente"
        descripcion="Las fichas se crean al registrar una cotización o un contrato. Una ficha puede existir sin cuenta de acceso al portal."
        accion={
          <Link
            href="/admin/cotizaciones"
            className="rounded border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
          >
            Ir a Cotizaciones
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
        placeholder="Buscar por nombre, teléfono, email o ciudad..."
      />

      <DataTable>
        <DataTableHead>
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Contacto</th>
            <th className="px-4 py-3 font-medium">Ciudad</th>
            <th className="px-4 py-3 font-medium">Cuenta</th>
            <th className="px-4 py-3 font-medium">Cotizaciones</th>
            <th className="px-4 py-3 font-medium">Contratos</th>
            <th className="px-4 py-3 font-medium">Obras</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </DataTableHead>
        <tbody className="divide-y divide-border">
          {filtrados.map((c) => (
            <tr key={c.id} className="hover:bg-ink/[0.02]">
              <td className="px-4 py-3">
                <p className="font-medium">
                  {c.nombre} {c.apellidos}
                </p>
              </td>
              <td className="px-4 py-3">
                <p>{c.telefono}</p>
                {c.email && <p className="text-xs text-ink-muted">{c.email}</p>}
              </td>
              <td className="px-4 py-3 text-ink-muted">{c.ciudad ?? "—"}</td>
              <td className="px-4 py-3">
                {c.tieneCuenta ? (
                  <Badge variante={c.cuentaActiva ? "success" : "danger"}>
                    {c.cuentaActiva ? "Con cuenta" : "Suspendida"}
                  </Badge>
                ) : (
                  <Badge variante="neutral">Sin cuenta</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">{c.totalCotizaciones}</td>
              <td className="px-4 py-3 text-ink-muted">{c.totalContratos}</td>
              <td className="px-4 py-3 text-ink-muted">
                {c.totalObras}
                {c.obrasActivas > 0 && (
                  <span className="ml-1 text-xs text-accent-strong">
                    ({c.obrasActivas} activa{c.obrasActivas > 1 ? "s" : ""})
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="text-sm text-accent-strong hover:underline"
                >
                  Ver ficha
                </Link>
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <DataTableEmpty colSpan={8}>
              Ningún cliente coincide con la búsqueda.
            </DataTableEmpty>
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
