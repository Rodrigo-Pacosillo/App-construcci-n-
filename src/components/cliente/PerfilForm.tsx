"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import {
  ArrowUpRight,
  CalendarDays,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";
import { cambiarPassword } from "@/app/cliente/perfil/actions";
import {
  PLAZO_INICIO_LABELS,
  RANGO_M2_LABELS,
  TIPO_CONSTRUCCION_LABELS,
  TIPO_OBRA_LABELS,
  WHATSAPP_NUMERO,
  WHATSAPP_NUMERO_FORMATO,
} from "@/lib/constants";
import { formatFecha } from "@/lib/format";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
    confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PerfilInicial = {
  nombre: string;
  apellidos: string;
  telefono: string;
  ciudad: string | null;
  emailContacto: string | null;
  clienteCreadoEn: Date | string;
  emailAcceso: string;
  cuentaActiva: boolean;
  cuentaCreadoEn: Date | string;
  cotizacion: {
    tipoObra: string;
    tipoConstruccion: string;
    rangoM2: string;
    ubicacionObra: string | null;
    plazoInicio: string;
    creadoEn: Date | string;
  } | null;
};

/** Toma la etiqueta oficial y se queda con la parte corta, antes del guion. */
function etiquetaCorta(valor: string, labels: Record<string, string>): string {
  const texto = labels[valor] ?? valor.replace(/_/g, " ");
  return texto.split("—")[0].trim();
}

// El enum de Prisma incluye `integral`, ausente en TIPO_CONSTRUCCION_LABELS.
const etiquetasConstruccion: Record<string, string> = {
  ...TIPO_CONSTRUCCION_LABELS,
  integral: "Obra integral",
};

function Dato({
  etiqueta,
  valor,
  icono: Icono,
}: {
  etiqueta: string;
  valor: string | null;
  icono?: LucideIcon;
}) {
  return (
    <div className="rounded border border-border bg-background p-4">
      <dt className="section-label flex items-center gap-2 text-ink-faint">
        {Icono && <Icono className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {etiqueta}
      </dt>
      <dd className="mt-2 break-words text-sm text-ink">{valor || "—"}</dd>
    </div>
  );
}

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-border bg-surface p-6">
      <h2 className="section-label mb-4 text-ink-faint">{titulo}</h2>
      {children}
    </section>
  );
}

export function PerfilForm({ inicial }: { inicial: PerfilInicial }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsed = passwordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setGuardando(true);
    try {
      const result = await cambiarPassword(parsed.data.password);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess("Contraseña cambiada correctamente");
      setPassword("");
      setConfirmPassword("");
    } finally {
      setGuardando(false);
    }
  };

  const nombreCompleto = `${inicial.nombre} ${inicial.apellidos}`.trim();
  const mensajeWhatsApp = encodeURIComponent(
    "Hola, necesito actualizar mis datos personales en el portal de clientes de CONSTR-ART."
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-ink/5"
          aria-hidden="true"
        >
          <User className="h-6 w-6 text-ink-muted" />
        </div>
        <div className="min-w-0">
          <p className="section-label text-ink-faint">MI CUENTA</p>
          <h1 className="mt-1 font-heading text-3xl font-bold">{nombreCompleto}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Cliente desde {formatFecha(inicial.clienteCreadoEn)}
          </p>
        </div>
      </div>

      <Bloque titulo="DATOS PERSONALES">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato etiqueta="Nombre(s)" valor={inicial.nombre} />
          <Dato etiqueta="Apellidos" valor={inicial.apellidos} />
          <Dato etiqueta="Teléfono" valor={inicial.telefono} icono={Phone} />
          <Dato etiqueta="Ciudad" valor={inicial.ciudad} icono={MapPin} />
          <Dato etiqueta="Email de contacto" valor={inicial.emailContacto} icono={Mail} />
        </dl>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm text-ink-muted">
            Para modificar sus datos personales, contacte al administrador.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}?text=${mensajeWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-ink transition-colors hover:border-accent hover:bg-ink/5"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Escribir al {WHATSAPP_NUMERO_FORMATO}
          </a>
        </div>
      </Bloque>

      <Bloque titulo="CUENTA DE ACCESO">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato etiqueta="Email de acceso" valor={inicial.emailAcceso} icono={Mail} />
          <Dato
            etiqueta="Estado"
            valor={inicial.cuentaActiva ? "Activa" : "Suspendida"}
          />
          <Dato
            etiqueta="Alta de cuenta"
            valor={formatFecha(inicial.cuentaCreadoEn)}
            icono={CalendarDays}
          />
        </dl>
        <p className="mt-4 text-xs text-ink-faint">
          Su cuenta de acceso es independiente de su ficha de contacto.
        </p>
      </Bloque>

      <Bloque titulo="MI SOLICITUD">
        {inicial.cotizacion ? (
          <>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Dato
                etiqueta="Tipo de obra"
                valor={etiquetaCorta(inicial.cotizacion.tipoObra, TIPO_OBRA_LABELS)}
              />
              <Dato
                etiqueta="Tipo de construcción"
                valor={etiquetaCorta(
                  inicial.cotizacion.tipoConstruccion,
                  etiquetasConstruccion
                )}
              />
              <Dato
                etiqueta="Superficie"
                valor={etiquetaCorta(inicial.cotizacion.rangoM2, RANGO_M2_LABELS)}
              />
              <Dato
                etiqueta="Plazo de inicio"
                valor={etiquetaCorta(inicial.cotizacion.plazoInicio, PLAZO_INICIO_LABELS)}
              />
              <Dato
                etiqueta="Ubicación de la obra"
                valor={inicial.cotizacion.ubicacionObra}
                icono={MapPin}
              />
              <Dato
                etiqueta="Fecha de solicitud"
                valor={formatFecha(inicial.cotizacion.creadoEn)}
                icono={CalendarDays}
              />
            </dl>
            <Link
              href="/cliente/cotizaciones"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent-strong transition-opacity hover:opacity-80"
            >
              Ver el detalle de mis cotizaciones
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Todavía no tiene una solicitud registrada.
          </p>
        )}
      </Bloque>

      <Bloque titulo="SEGURIDAD">
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-green-600">
              {success}
            </p>
          )}

          <div>
            <label htmlFor="password" className="section-label block text-ink-faint">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="section-label block text-ink-faint">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={
              guardando || !password || !confirmPassword || password !== confirmPassword
            }
            className="accent-btn inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {guardando ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </Bloque>
    </div>
  );
}
