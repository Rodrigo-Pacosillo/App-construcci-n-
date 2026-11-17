import { prisma } from "@/lib/db";
import type { VistaCotizacionPublica } from "@/lib/ai/chat/tipos";
import {
  TIPO_OBRA_LABELS,
  TIPO_CONSTRUCCION_LABELS,
  RANGO_M2_LABELS,
  PLAZO_INICIO_LABELS,
} from "@/lib/constants";

export type CotizacionPublicaRow = {
  tipoObra: string;
  tipoConstruccion: string;
  rangoM2: string;
  plazoInicio: string;
  ubicacionObra: string | null;
  requerimiento: string | null;
  fotoLoteUrl?: string | null;
};

/**
 * Convierte una fila de cotizacion en la vista publica.
 * Es la unica puerta por la que los datos de la cotizacion llegan al prompt
 * o al saludo: nada de notas internas, montos ni identificadores.
 */
export function mapearCotizacionPublica(
  cot: CotizacionPublicaRow
): VistaCotizacionPublica {
  return {
    tipoObra:
      TIPO_OBRA_LABELS[cot.tipoObra as keyof typeof TIPO_OBRA_LABELS] ??
      cot.tipoObra,
    tipoConstruccion:
      TIPO_CONSTRUCCION_LABELS[
        cot.tipoConstruccion as keyof typeof TIPO_CONSTRUCCION_LABELS
      ] ?? cot.tipoConstruccion,
    rangoM2:
      RANGO_M2_LABELS[cot.rangoM2 as keyof typeof RANGO_M2_LABELS] ??
      cot.rangoM2,
    plazoInicio:
      PLAZO_INICIO_LABELS[cot.plazoInicio as keyof typeof PLAZO_INICIO_LABELS] ??
      cot.plazoInicio,
    ubicacionObra: cot.ubicacionObra,
    requerimiento: cot.requerimiento
      ? String(cot.requerimiento).replace(/\s+/g, " ").trim().slice(0, 300)
      : null,
    tieneFoto: Boolean(cot.fotoLoteUrl),
  };
}

export async function vistaCotizacionPublica(
  id: string
): Promise<VistaCotizacionPublica | null> {
  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    select: {
      tipoObra: true,
      tipoConstruccion: true,
      rangoM2: true,
      plazoInicio: true,
      ubicacionObra: true,
      requerimiento: true,
      fotoLoteUrl: true,
    },
  });
  if (!cot) return null;
  return mapearCotizacionPublica(cot);
}
