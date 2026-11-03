"use client";

import { useState, useMemo } from "react";

type EventoCalendario = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string | null;
  todoElDia: boolean;
};

type ObraCalendario = {
  id: string;
  direccionObra: string;
};

interface CalendarioGridProps {
  eventos: EventoCalendario[];
  obra: ObraCalendario | null;
}

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const TIPO_LABEL: Record<string, string> = {
  nota: "Nota",
  recordatorio: "Recordatorio",
  inicio_etapa: "Inicio de etapa",
  fin_etapa: "Fin de etapa",
  entrega: "Entrega",
  reunion: "Reunión",
  otro: "Otro",
};

const TIPO_COLOR: Record<string, string> = {
  nota: "bg-ink/10 text-ink border-ink/20",
  recordatorio: "bg-amber-50 text-amber-700 border-amber-200/50",
  inicio_etapa: "bg-green-50 text-green-700 border-green-200/50",
  fin_etapa: "bg-blue-50 text-blue-700 border-blue-200/50",
  entrega: "bg-purple-50 text-purple-700 border-purple-200/50",
  reunion: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
  otro: "bg-neutral-50 text-neutral-700 border-neutral-200/50",
};

function formatoFechaISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseFechaISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function CalendarioGrid({ eventos, obra }: CalendarioGridProps) {
  const [fechaActual, setFechaActual] = useState<Date>(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const year = fechaActual.getFullYear();
  const month = fechaActual.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  const inicioSemana = (primerDia.getDay() + 6) % 7;
  const finSemana = (ultimoDia.getDay() + 6) % 7;
  const celdasVaciasInicio = inicioSemana;
  const celdasVaciasFin = 6 - finSemana;
  const totalCeldas = celdasVaciasInicio + diasEnMes + celdasVaciasFin;

  const hoy = new Date();
  const hoyISO = formatoFechaISO(hoy);

  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, EventoCalendario[]> = {};
    eventos.forEach((e) => {
      const d = parseFechaISO(e.fechaInicio);
      if (!d) return;
      const key = formatoFechaISO(d);
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(e);
    });
    return mapa;
  }, [eventos]);

  const mesNombre = MESES[month];

  const irAMesAnterior = () => {
    setFechaActual(new Date(year, month - 1, 1));
  };

  const irAMesSiguiente = () => {
    setFechaActual(new Date(year, month + 1, 1));
  };

  const esHoy = (iso: string) => iso === hoyISO;
  const esSeleccionado = (iso: string) => iso === diaSeleccionado;

  const eventosDelDiaSeleccionado = useMemo(() => {
    if (!diaSeleccionado) return [];
    return eventosPorDia[diaSeleccionado] ?? [];
  }, [diaSeleccionado, eventosPorDia]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="section-label mb-2 text-ink-faint">CALENDARIO DE OBRA</p>
          <h1 className="font-heading text-3xl font-bold">
            {obra?.direccionObra || "Mi obra"}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Fechas y eventos publicados por el administrador.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={irAMesAnterior}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-ink-muted hover:bg-ink/5 transition-colors"
          >
            ◀ Mes anterior
          </button>
          <span className="font-medium text-ink">
            {mesNombre} {year}
          </span>
          <button
            onClick={irAMesSiguiente}
            className="rounded border border-border bg-background px-3 py-2 text-sm text-ink-muted hover:bg-ink/5 transition-colors"
          >
            Mes siguiente ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="text-center text-xs font-medium text-ink-muted uppercase tracking-wider"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: totalCeldas }).map((_, i) => {
          const esVacía =
            i < celdasVaciasInicio || i >= celdasVaciasInicio + diasEnMes;
          const diaNumero = esVacía
            ? null
            : i - celdasVaciasInicio + 1;
          const fecha = diaNumero
            ? new Date(year, month, diaNumero)
            : null;
          const fechaISO = fecha ? formatoFechaISO(fecha) : null;
          const eventosDia = fechaISO ? eventosPorDia[fechaISO] ?? [] : [];

          if (esVacía || !fechaISO) {
            return <div key={i} className="min-h-[80px]" />;
          }

          const esDiaHoy = esHoy(fechaISO);
          const esDiaSel = esSeleccionado(fechaISO);
          const tieneEventos = eventosDia.length > 0;

          return (
            <div
              key={i}
              onClick={() => setDiaSeleccionado(fechaISO)}
              className={`min-h-[80px] flex flex-col justify-end rounded border p-2 transition-colors cursor-pointer hover:bg-ink/5 ${
                esDiaHoy
                  ? "bg-accent/10 border-accent ring-1 ring-accent"
                  : esDiaSel
                  ? "bg-accent/20 border-accent"
                  : tieneEventos
                  ? "bg-ink/5 border-ink/20"
                  : "bg-background border-border"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    esDiaHoy
                      ? "text-accent-strong font-bold"
                      : esDiaSel
                      ? "text-accent-strong"
                      : tieneEventos
                      ? "text-ink"
                      : "text-ink-faint"
                  }`}
                >
                  {diaNumero}
                </span>
                {tieneEventos && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      TIPO_COLOR[eventosDia[0].tipo] ??
                      TIPO_COLOR.otro
                    }`}
                    title={`${eventosDia.length} evento${
                      eventosDia.length > 1 ? "s" : ""
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div className="rounded border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label text-ink-faint">
              EVENTOS DEL {diaSeleccionado}
            </p>
            <button
              onClick={() => setDiaSeleccionado(null)}
              className="text-xs text-ink-muted hover:text-ink underline"
            >
              Limpiar selección
            </button>
          </div>

          {eventosDelDiaSeleccionado.length > 0 ? (
            <div className="space-y-3">
              {eventosDelDiaSeleccionado.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between rounded border border-border bg-background p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${TIPO_COLOR[e.tipo] ?? TIPO_COLOR.otro}`}
                      >
                        {TIPO_LABEL[e.tipo] ?? e.tipo}
                      </span>
                      <span className="ml-2 text-xs text-ink-faint">
                        {new Date(e.fechaInicio).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {e.fechaFin ? " –" : ""}
                      </span>
                      {e.fechaFin && (
                        <span className="ml-1 text-xs text-ink-faint">
                          {new Date(e.fechaFin).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-medium">{e.titulo}</h3>
                    {e.descripcion && (
                      <p className="mt-1 text-sm text-ink-muted line-clamp-2">
                        {e.descripcion}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded border border-border bg-ink/5 text-ink-muted"
                  >
                    {e.todoElDia ? "Todo el día" : "Con hora"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded border border-border bg-background p-6 text-center">
              <p className="section-label text-ink-faint">SIN EVENTOS</p>
              <p className="mt-2 text-sm text-ink-muted">
                No hay eventos programados para este día.
              </p>
            </div>
          )}
        </div>
      )}

      {eventos.length === 0 && !diaSeleccionado && (
        <div className="rounded border border-border bg-surface p-8 text-center">
          <p className="section-label text-ink-faint">SIN EVENTOS PROGRAMADOS</p>
          <p className="mt-2 text-sm text-ink-muted">
            El administrador agregará eventos al calendario conforme avance la obra.
          </p>
        </div>
      )}
    </div>
  );
}
