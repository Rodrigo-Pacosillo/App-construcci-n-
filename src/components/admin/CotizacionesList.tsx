"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import {
  ESTADO_COLORES,
  ESTADO_LABELS,
  ESTADOS_POR_GRUPO,
  TIPO_OBRA_LABELS,
  type EstadoCotizacion,
  type GrupoCotizacion,
} from "@/lib/constants";
import { telefonoParaWhatsApp } from "@/lib/format";

type Cotizacion = {
  id: string;
  estado: string;
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  origen: string;
  ubicacionObra: string | null;
  creadoEn: Date;
  contratos: { id: string }[];
  cliente: {
    id: string;
    nombre: string;
    apellidos: string;
    telefono: string;
    email: string | null;
  } | null;
};

type Filtro = "todos" | GrupoCotizacion;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "por_revisar", label: "Por revisar" },
  { id: "pendientes", label: "Pendiente" },
  { id: "finalizadas", label: "Finalizadas" },
];

const TIPO_CONSTRUCCION_CORTO: Record<string, string> = {
  seco: "Steel Frame",
  tradicional: "Tradicional",
  no_sabe: "No sabe",
};

function nombreCliente(c: Cotizacion) {
  return `${c.cliente?.nombre ?? ""} ${c.cliente?.apellidos ?? ""}`.trim() || "—";
}

function tipoObraLabel(tipo: string) {
  return TIPO_OBRA_LABELS[tipo as keyof typeof TIPO_OBRA_LABELS] ?? tipo;
}

function tipoConstruccionLabel(tipo: string) {
  return TIPO_CONSTRUCCION_CORTO[tipo] ?? tipo.replace("_", " ");
}

function rangoM2Label(rango: string) {
  return `${rango.replace(/^m/, "").replace("_", "-").replace("mas", "+")} m2`;
}

function mensajeWhatsApp(c: Cotizacion) {
  const nombre = c.cliente?.nombre?.trim();
  const saludo = nombre ? `Hola ${nombre}` : "Hola";
  const tipo = tipoObraLabel(c.tipoObra).toLowerCase();
  const ubicacion = c.ubicacionObra ? ` en ${c.ubicacionObra}` : "";
  return `${saludo}, le escribo de CONSTR-ART por su solicitud de cotización de ${tipo}${ubicacion}. ¿Podemos conversar?`;
}

export function CotizacionesList({
  cotizaciones,
  filtroInicial,
}: {
  cotizaciones: Cotizacion[];
  filtroInicial?: GrupoCotizacion;
}) {
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial ?? "todos");
  const [busqueda, setBusqueda] = useState("");
  const [contactadas, setContactadas] = useState<Set<string>>(new Set());

  function marcarContactada(id: string) {
    setContactadas((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return cotizaciones.filter((c) => {
      if (
        filtro !== "todos" &&
        !ESTADOS_POR_GRUPO[filtro].includes(c.estado as EstadoCotizacion)
      ) {
        return false;
      }
      if (!q) return true;

      const nombre = `${c.cliente?.nombre ?? ""} ${c.cliente?.apellidos ?? ""}`.toLowerCase();
      const telefono = (c.cliente?.telefono ?? "").toLowerCase();
      return nombre.includes(q) || telefono.includes(q);
    });
  }, [cotizaciones, filtro, busqueda]);

  function contar(filtroId: Filtro) {
    if (filtroId === "todos") return cotizaciones.length;
    return cotizaciones.filter((c) =>
      ESTADOS_POR_GRUPO[filtroId].includes(c.estado as EstadoCotizacion)
    ).length;
  }

  return (
    <div>
      {/* Filtros y búsqueda */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`inline-flex h-8 items-center justify-center rounded border px-3 text-xs font-medium transition-colors ${
                filtro === f.id
                  ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-border bg-surface text-ink-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {f.label} ({contar(f.id)})
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 section-label text-ink-faint">Cliente</th>
                <th className="hidden px-4 py-3 section-label text-ink-faint md:table-cell">
                  Solicitud
                </th>
                <th className="hidden px-4 py-3 section-label text-ink-faint sm:table-cell">
                  Fecha
                </th>
                <th className="px-4 py-3 section-label text-ink-faint">Estado</th>
                <th className="px-4 py-3 text-right section-label text-ink-faint">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const telefono = telefonoParaWhatsApp(c.cliente?.telefono);
                const waUrl = telefono
                  ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeWhatsApp(c))}`
                  : null;
                const estado = c.estado as EstadoCotizacion;
                const contratoExistente = c.contratos?.[0]?.id;
                const habilitadoCrear =
                  estado === "contactado" ||
                  estado === "contratado" ||
                  contactadas.has(c.id);
                const mostrarCrear = estado !== "no_concretado";

                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-ink/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{nombreCliente(c)}</p>
                      <p className="text-xs text-ink-faint">
                        {c.cliente?.telefono || "Sin teléfono"}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="text-ink">{tipoObraLabel(c.tipoObra)}</p>
                      <p className="text-xs text-ink-faint">
                        {tipoConstruccionLabel(c.tipoConstruccion)}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-ink-muted sm:table-cell">
                      {new Date(c.creadoEn).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          ESTADO_COLORES[estado] ?? "bg-ink/5 text-ink-muted"
                        }`}
                      >
                        {ESTADO_LABELS[estado] ?? estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => marcarContactada(c.id)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-green-600 px-3 text-xs font-medium text-white transition-colors hover:bg-green-700"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Contactar
                          </a>
                        ) : (
                          <span
                            aria-disabled="true"
                            title="El cliente no tiene teléfono registrado"
                            className="inline-flex h-8 cursor-not-allowed items-center justify-center gap-1.5 rounded border border-border px-3 text-xs font-medium text-ink-faint"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Contactar
                          </span>
                        )}
                        <Link
                          href={`/admin/cotizaciones/${c.id}`}
                          className="inline-flex h-8 items-center justify-center rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                        >
                          Ver
                        </Link>
                        {contratoExistente ? (
                          <Link
                            href={`/admin/contratos/${contratoExistente}`}
                            className="inline-flex h-8 items-center justify-center rounded border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                          >
                            Contrato existente
                          </Link>
                        ) : mostrarCrear ? (
                          habilitadoCrear ? (
                            <Link
                              href={`/admin/contratos/new?cotizacionId=${c.id}&clienteId=${c.cliente?.id ?? ""}`}
                              className="inline-flex h-8 items-center justify-center rounded border border-border px-3 text-xs font-medium text-ink transition-colors hover:bg-ink/5"
                            >
                              Crear contrato
                            </Link>
                          ) : (
                            <span
                              aria-disabled="true"
                              title="Contactá al cliente para habilitar la creación del contrato"
                              className="inline-flex h-8 cursor-not-allowed items-center justify-center rounded border border-border px-3 text-xs font-medium text-ink-faint"
                            >
                              Crear contrato
                            </span>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-faint">
                    {busqueda
                      ? "No hay cotizaciones que coincidan con la búsqueda."
                      : "No hay cotizaciones en este grupo."}
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
