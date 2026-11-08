import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarTexto, normalizarTelefono, tokenizar } from "../../src/lib/ai/datos/normalizar";

test("normalizarTexto quita acentos", () => {
  assert.equal(normalizarTexto("Pérez"), "perez");
  assert.equal(normalizarTexto("  Hola   Mundo  "), "hola mundo");
});

test("normalizarTelefono quita 591", () => {
  assert.equal(normalizarTelefono("+591 71234567"), "71234567");
  assert.equal(normalizarTelefono("71234567"), "71234567");
});

test("tokenizar separa", () => {
  assert.deepEqual(tokenizar("Juan Perez"), ["juan", "perez"]);
});
