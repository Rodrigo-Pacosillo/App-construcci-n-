/**
 * Script de evaluacion de agentes IA para Constr-art (Fase 10 - formato nuevo).
 * Nota: ejecucion real del agente requiere servidor + BD + proveedor IA.
 * Este runner valida la estructura de los casos y reporta cobertura.
 */

import * as fs from "fs";
import * as path from "path";

interface CasoEval {
  id: string;
  entrada: string;
  esperar: { herramientas?: string[]; texto_coincide?: string[]; texto_no_coincide?: string[] };
}

function parseYaml(content: string): CasoEval[] {
  // Parser minimal para el formato nuevo (id/entrada/esperar).
  const casos: CasoEval[] = [];
  let actual: CasoEval | null = null;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("- id:")) {
      if (actual) casos.push(actual);
      actual = { id: line.replace("- id:", "").trim(), entrada: "", esperar: {} };
    } else if (line.startsWith("entrada:") && actual) {
      actual.entrada = line.replace("entrada:", "").trim().replace(/^"|"$/g, "");
    } else if (line.startsWith("herramientas:") && actual) {
      const arr = line.replace("herramientas:", "").trim();
      actual.esperar.herramientas = arr.replace(/[\[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (actual) casos.push(actual);
  return casos;
}

async function main() {
  const evalDir = path.join(process.cwd(), "tests", "ai-evals");
  const archivos = fs.readdirSync(evalDir).filter((f) => f.endsWith(".yaml"));
  let total = 0;
  for (const archivo of archivos) {
    const contenido = fs.readFileSync(path.join(evalDir, archivo), "utf-8");
    const casos = parseYaml(contenido);
    total += casos.length;
    console.log(`${archivo}: ${casos.length} casos`);
    for (const c of casos) console.log(`  - ${c.id}: ${c.entrada}`);
  }
  console.log(`Total casos: ${total}`);
  console.log("Ejecucion real del agente pendiente de entorno (servidor + BD + API key).");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
