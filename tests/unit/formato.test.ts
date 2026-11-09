import { test } from "node:test";
import assert from "node:assert/strict";
import { fechaNegocio, instanteNegocio } from "../../src/lib/ai/datos/formato";

test("fechaNegocio - formatea fecha correctamente", () => {
  const fecha = new Date("2026-01-15T10:30:00Z");
  const resultado = fechaNegocio(fecha);
  assert.ok(resultado.includes("15/01/2026"));
});

test("fechaNegocio - retorna vacío para null/undefined", () => {
  assert.equal(fechaNegocio(null), "");
  assert.equal(fechaNegocio(undefined), "");
});

test("fechaNegocio - retorna vacío para fecha inválida", () => {
  assert.equal(fechaNegocio(new Date("invalid")), "");
});

test("instanteNegocio - convierte fecha YYYY-MM-DD a Date UTC (mediodía + offset)", () => {
  const resultado = instanteNegocio("2026-01-15");
  // 12:00 UTC + 4h offset = 16:00 UTC
  assert.equal(resultado.getUTCHours(), 16);
  assert.equal(resultado.getUTCMinutes(), 0);
  assert.equal(resultado.getUTCDate(), 15);
  assert.equal(resultado.getUTCMonth(), 0);
  assert.equal(resultado.getUTCFullYear(), 2026);
});

test("instanteNegocio - convierte fecha y hora a Date UTC", () => {
  const resultado = instanteNegocio("2026-01-15", "14:30");
  // 14:30 en TZ_NEGOCIO (UTC-4) = 18:30 UTC
  assert.equal(resultado.getUTCHours(), 18);
  assert.equal(resultado.getUTCMinutes(), 30);
});

test("instanteNegocio - lanza error en mes inválido (>12)", () => {
  assert.throws(() => instanteNegocio("2026-13-01"), /Fecha inexistente/);
});

test("instanteNegocio - lanza error en fecha inexistente (31 feb)", () => {
  assert.throws(() => instanteNegocio("2026-02-31"), /Fecha inexistente/);
});

test("instanteNegocio - lanza error en formato de fecha incorrecto", () => {
  assert.throws(() => instanteNegocio("invalid"), /Fecha inválida/);
});

test("instanteNegocio - lanza error en hora inválida (fuera de rango)", () => {
  assert.throws(() => instanteNegocio("2026-01-15", "25:00"), /Hora inválida/);
  assert.throws(() => instanteNegocio("2026-01-15", "14:60"), /Hora inválida/);
});

test("instanteNegocio - no lanza error en formato de hora inválido (regex no coincide)", () => {
  // "invalid" no coincide con regex /^\d{2}:\d{2}$/, así que se usa mediodía por defecto
  const resultado = instanteNegocio("2026-01-15", "invalid");
  assert.equal(resultado.getUTCHours(), 16); // mediodía + 4h
  assert.equal(resultado.getUTCMinutes(), 0);
});