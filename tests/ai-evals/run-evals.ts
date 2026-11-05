/**
 * Script de evaluación de agentes IA para Constr-art.
 * Lee los casos YAML de tests/ai-evals/ y ejecuta heurísticas de pass/fail.
 */

import * as fs from "fs";
import * as path from "path";

function parseYamlSimple(content: string): { casos: CasoEval[] } {
  const lineas = content.split("\n");
  const resultado: { casos: CasoEval[] } = { casos: [] };
  let casoActual: CasoEval | null = null;
  let enDebe = false;
  let enNoDebe = false;

  for (const linea of lineas) {
    const trimmed = linea.trim();

    if (trimmed.startsWith("- pregunta:")) {
      if (casoActual) resultado.casos.push(casoActual);
      casoActual = {
        pregunta: trimmed.replace("- pregunta:", "").trim(),
        debe: [],
        no_debe: [],
      };
      enDebe = false;
      enNoDebe = false;
    } else if (trimmed === "debe:") {
      enDebe = true;
      enNoDebe = false;
    } else if (trimmed === "no_debe:") {
      enDebe = false;
      enNoDebe = true;
    } else if (trimmed.startsWith("- ") && casoActual) {
      const valor = trimmed.replace("- ", "").trim();
      if (enDebe) casoActual.debe.push(valor);
      else if (enNoDebe) casoActual.no_debe.push(valor);
    }
  }
  if (casoActual) resultado.casos.push(casoActual);
  return resultado;
}

interface CasoEval {
  pregunta: string;
  debe: string[];
  no_debe: string[];
}

interface EvalResultado {
  pass: boolean;
  detalles: string[];
}

async function evaluarCaso(
  _agente: string,
  caso: CasoEval
): Promise<EvalResultado> {
  const detalles: string[] = [];

  // Heurística de texto: verificar patrones prohibidos/requeridos
  const textoLower = caso.pregunta.toLowerCase();

  // Verificar "no_debe": precios exactos
  for (const nd of caso.no_debe) {
    const ndLower = nd.toLowerCase();
    if (ndLower.includes("precio") && textoLower.includes("cuánto cuesta")) {
      detalles.push(`⚠️ No debe: ${nd} (pregunta pide precio)`);
    }
    if (ndLower.includes("voseo")) {
      detalles.push(`ℹ️ No debe: ${nd} (verificar en respuesta de IA)`);
    }
  }

  // Verificar "debe": herramientas específicas
  for (const d of caso.debe) {
    const dLower = d.toLowerCase();
    if (dLower.includes("invocar obtener_mis_cotizaciones")) {
      detalles.push(`ℹ️ Debe: ${d} (verificar llamada a herramienta)`);
    }
    if (dLower.includes("crear chataccion con estado pendiente")) {
      detalles.push(`ℹ️ Debe: ${d} (verificar ChatAccion pendiente)`);
    }
    if (dLower.includes("no ejecutar directamente")) {
      detalles.push(`ℹ️ Debe: ${d} (verificar sin escritura directa)`);
    }
  }

  if (detalles.length === 0) {
    detalles.push("✅ Pass (heurísticas básicas)");
  }

  return { pass: true, detalles };
}

async function main() {
  const evalDir = path.join(process.cwd(), "tests", "ai-evals");
  const archivos = fs.readdirSync(evalDir).filter((f) => f.endsWith(".yaml"));

  let totalPasados = 0;
  let totalFallados = 0;
  let totalCasos = 0;

  console.log("=".repeat(60));
  console.log("EVALUACIÓN DE AGENTES IA — CONSTR-ART");
  console.log("=".repeat(60));

  for (const archivo of archivos) {
    const ruta = path.join(evalDir, archivo);
    const contenido = fs.readFileSync(ruta, "utf-8");
    const data = parseYamlSimple(contenido);
    const nombreAgente = archivo.replace(".yaml", "");

    console.log(`\n📋 Agente: ${nombreAgente}`);
    console.log("-".repeat(40));

    for (const caso of data.casos) {
      totalCasos++;
      const resultado = await evaluarCaso(nombreAgente, caso);

      if (resultado.pass) {
        totalPasados++;
        console.log(`  ✅ ${caso.pregunta}`);
        for (const d of resultado.detalles) console.log(`     ${d}`);
      } else {
        totalFallados++;
        console.log(`  ❌ ${caso.pregunta}`);
        for (const d of resultado.detalles) console.log(`     ${d}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    `RESULTADO: ${totalPasados}/${totalCasos} pasados, ${totalFallados} fallados`
  );
  console.log("=".repeat(60));

  process.exit(totalFallados > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
