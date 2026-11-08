import { prisma } from "@/lib/db";
import { VistaCotizacionPublica } from "@/lib/ai/chat/tipos";
import {
  TIPO_OBRA_LABELS,
  TIPO_CONSTRUCCION_LABELS,
  RANGO_M2_LABELS,
  PLAZO_INICIO_LABELS,
} from "@/lib/constants";

export async function vistaCotizacionPublica(id: string): Promise<VistaCotizacionPublica | null> {
  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    select: {
      tipoObra: true,
      tipoConstruccion: true,
      rangoM2: true,
      plazoInicio: true,
      ubicacionObra: true,
      requerimiento: true,
    },
  });
  if (!cot) return null;

  return {
    tipoObra: TIPO_OBRA_LABELS[cot.tipoObra as keyof typeof TIPO_OBRA_LABELS] ?? cot.tipoObra,
    tipoConstruccion: TIPO_CONSTRUCCION_LABELS[cot.tipoConstruccion as keyof typeof TIPO_CONSTRUCCION_LABELS] ?? cot.tipoConstruccion,
    rangoM2: RANGO_M2_LABELS[cot.rangoM2 as keyof typeof RANGO_M2_LABELS] ?? cot.rangoM2,
    plazoInicio: PLAZO_INICIO_LABELS[cot.plazoInicio as keyof typeof PLAZO_INICIO_LABELS] ?? cot.plazoInicio,
    ubicacionObra: cot.ubicacionObra,
    requerimiento: cot.requerimiento ? String(cot.requerimiento).replace(/\n/g, " ").slice(0, 200) : null,
  };
}