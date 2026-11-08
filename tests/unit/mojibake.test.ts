import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";

const MOJIBAKE_REGEX = /[ÃÂ][¡-¯]|â€[œ™€]|âŸ|â†/;

function checkFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const matches = content.match(MOJIBAKE_REGEX);
  return matches ? matches.length : 0;
}

test("no mojibake en src/lib/ai", () => {
  const aiDir = join(process.cwd(), "src/lib/ai");
  const files = [
    "saludos/publico.ts",
    "saludos/cliente.ts",
    "saludos/admin.ts",
    "prompts/base.ts",
    "prompts/publico.ts",
    "prompts/cliente.ts",
    "prompts/admin.ts",
  ];
  for (const f of files) {
    const count = checkFile(join(aiDir, f));
    assert.equal(count, 0, `${f} tiene ${count} caracteres mojibake`);
  }
});

test("no mojibake en src/app/api/chat/route.ts (comentarios y strings)", () => {
  const count = checkFile(join(process.cwd(), "src/app/api/chat/route.ts"));
  assert.equal(count, 0, `route.ts tiene ${count} caracteres mojibake`);
});

// Palabras que DEBEN llevar tilde en español pero a menudo se escriben sin ella
// Solo las que son errores ortográficos reales, no palabras que correctamente no la llevan
const PALABRAS_CON_TILDE_OBLIGATORIA = [
  "construccion",    // construcción
  "manana",          // mañana
  "espanol",         // español
  "proximo",         // próximo
  "tecnico",         // técnico
  "limite",          // límite
  "sesion",          // sesión
  "accion",          // acción
  "solucion",        // solución
  "reunion",         // reunión
  "codigo",          // código
  "analisis",        // análisis
  "politica",        // política
  "categoria",       // categoría
  "unico",           // único
  "optimo",          // óptimo
  "maximo",          // máximo
  "minimo",          // mínimo
  "exito",           // éxito
  "termino",         // término
  "configuracion",   // configuración
  "informacion",     // información
  "documentacion",   // documentación
  "implementacion",  // implementación
  "migracion",       // migración
  "perdon",          // perdón
  "rapido",          // rápido
  "pequeno",         // pequeño
  "ultimo",          // último
  "ano",             // año
  "valido",          // válido
  "invalido",        // inválido
];

const TILDE_REGEX = new RegExp(`\\b(${PALABRAS_CON_TILDE_OBLIGATORIA.join("|")})\\b`, "gi");

test("tildes en lib/ai/prompts y saludos", () => {
  const aiDir = join(process.cwd(), "src/lib/ai");
  const files = [
    "saludos/publico.ts",
    "saludos/cliente.ts",
    "saludos/admin.ts",
    "prompts/base.ts",
    "prompts/publico.ts",
    "prompts/cliente.ts",
    "prompts/admin.ts",
  ];
  for (const f of files) {
    const content = readFileSync(join(aiDir, f), "utf-8");
    const matches = content.match(TILDE_REGEX);
    assert.equal(matches?.length ?? 0, 0, `${f} tiene palabras sin tilde obligatoria: ${matches?.join(", ")}`);
  }
});