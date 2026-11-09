import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ESTADOS_COTIZACION,
  ESTADO_LABELS,
  MAPEO_ESTADOS_ANTIGUOS,
  GRUPOS_COTIZACION,
  ESTADOS_POR_GRUPO,
  ESTADOS_OBRA,
  ESTADO_OBRA_LABELS,
  ESTADOS_PAGO,
  ESTADO_PAGO_LABELS,
  WHATSAPP_NUMERO,
} from "../../src/lib/constants";

test("ESTADOS_COTIZACION - tiene 4 estados", () => {
  assert.equal(ESTADOS_COTIZACION.length, 4);
  assert.deepEqual(ESTADOS_COTIZACION, ["nuevo", "contactado", "contratado", "no_concretado"]);
});

test("ESTADO_LABELS - mapea todos los estados a labels legibles", () => {
  assert.equal(ESTADO_LABELS.nuevo, "Por revisar");
  assert.equal(ESTADO_LABELS.contactado, "En seguimiento");
  assert.equal(ESTADO_LABELS.contratado, "Concretado");
  assert.equal(ESTADO_LABELS.no_concretado, "No concretado");
});

test("MAPEO_ESTADOS_ANTIGUOS - mapea estados legacy correctamente", () => {
  assert.equal(MAPEO_ESTADOS_ANTIGUOS.nuevo, "nuevo");
  assert.equal(MAPEO_ESTADOS_ANTIGUOS.contactado, "contactado");
  assert.equal(MAPEO_ESTADOS_ANTIGUOS.visita_tecnica, "contactado");
  assert.equal(MAPEO_ESTADOS_ANTIGUOS.presupuestado, "contactado");
  assert.equal(MAPEO_ESTADOS_ANTIGUOS.ganado, "contratado");
  assert.equal(MAPEO_ESTADOS_ANTIGUOS.perdido, "no_concretado");
});

test("GRUPOS_COTIZACION - tiene 3 grupos", () => {
  assert.equal(GRUPOS_COTIZACION.length, 3);
  assert.deepEqual(GRUPOS_COTIZACION, ["por_revisar", "pendientes", "finalizadas"]);
});

test("ESTADOS_POR_GRUPO - agrupa estados correctamente", () => {
  assert.deepEqual(ESTADOS_POR_GRUPO.por_revisar, ["nuevo"]);
  assert.deepEqual(ESTADOS_POR_GRUPO.pendientes, ["contactado"]);
  assert.deepEqual(ESTADOS_POR_GRUPO.finalizadas.sort(), ["contratado", "no_concretado"].sort());
});

test("ESTADOS_OBRA - tiene 4 estados", () => {
  assert.equal(ESTADOS_OBRA.length, 4);
  assert.deepEqual(ESTADOS_OBRA, ["en_curso", "pausada", "finalizada", "entregada"]);
});

test("ESTADO_OBRA_LABELS - mapea todos los estados de obra", () => {
  assert.equal(ESTADO_OBRA_LABELS.en_curso, "En curso");
  assert.equal(ESTADO_OBRA_LABELS.pausada, "Pausada");
  assert.equal(ESTADO_OBRA_LABELS.finalizada, "Finalizada");
  assert.equal(ESTADO_OBRA_LABELS.entregada, "Entregada");
});

test("ESTADOS_PAGO - tiene 2 estados", () => {
  assert.equal(ESTADOS_PAGO.length, 2);
  assert.deepEqual(ESTADOS_PAGO, ["registrado", "confirmado"]);
});

test("ESTADO_PAGO_LABELS - mapea estados de pago", () => {
  assert.equal(ESTADO_PAGO_LABELS.registrado, "Registrado");
  assert.equal(ESTADO_PAGO_LABELS.confirmado, "Confirmado");
});

test("WHATSAPP_NUMERO - formato correcto", () => {
  assert.equal(WHATSAPP_NUMERO, "59170646841");
});