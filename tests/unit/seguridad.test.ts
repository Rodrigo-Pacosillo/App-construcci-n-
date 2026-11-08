import { test } from "node:test";
import assert from "node:assert/strict";
import { limpiarParaModelo, assertSinProhibidos } from "../../src/lib/ai/datos/seguridad";

test("limpiarParaModelo elimina id", () => {
  const out = limpiarParaModelo({ id: "123", nombre: "Juan" }, "publico") as any;
  assert.equal(out.id, undefined);
  assert.equal(out.nombre, "Juan");
});

test("assertSinProhibidos lanza con cuid", () => {
  assert.throws(() => assertSinProhibidos({ token: "c" + "a".repeat(24) }, "publico"));
});
