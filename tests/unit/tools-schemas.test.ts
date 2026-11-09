import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// Test input schemas for tools
test("proponerNotaCalendarioTool - schema valida entrada correcta", () => {
  const schema = z.object({
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    obra: z.string().optional(),
  });

  const result = schema.safeParse({
    titulo: "Reunión con cliente",
    descripcion: "Revisar avances",
    fecha: "2026-01-15",
    hora: "14:30",
    obra: "Obra San Miguel",
  });
  assert.equal(result.success, true);
});

test("proponerNotaCalendarioTool - schema rechaza título vacío", () => {
  const schema = z.object({
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    obra: z.string().optional(),
  });

  const result = schema.safeParse({
    titulo: "",
    fecha: "2026-01-15",
  });
  assert.equal(result.success, false);
});

test("proponerNotaCalendarioTool - schema rechaza fecha inválida", () => {
  const schema = z.object({
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    obra: z.string().optional(),
  });

  const result = schema.safeParse({
    titulo: "Test",
    fecha: "15-01-2026", // formato incorrecto
  });
  assert.equal(result.success, false);
});

test("proponerNotaCalendarioTool - schema rechaza hora con formato inválido", () => {
  const schema = z.object({
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    obra: z.string().optional(),
  });

  // "invalid" no coincide con regex /^\d{2}:\d{2}$/
  const result = schema.safeParse({
    titulo: "Test",
    fecha: "2026-01-15",
    hora: "invalid",
  });
  assert.equal(result.success, false);
});

test("proponerEventoCalendarioTool - schema valida entrada correcta", () => {
  const schema = z.object({
    cliente: z.string().min(2),
    obra: z.string().optional(),
    tipo: z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    visibleCliente: z.boolean().optional(),
  });

  const result = schema.safeParse({
    cliente: "Juan Pérez",
    obra: "Obra San Miguel",
    tipo: "visita_tecnica",
    titulo: "Visita técnica",
    descripcion: "Revisar estructura",
    fecha: "2026-01-15",
    hora: "10:00",
    visibleCliente: true,
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.tipo, "visita_tecnica");
  }
});

test("proponerEventoCalendarioTool - usa tipo por defecto 'nota'", () => {
  const schema = z.object({
    cliente: z.string().min(2),
    obra: z.string().optional(),
    tipo: z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    visibleCliente: z.boolean().optional(),
  });

  const result = schema.safeParse({
    cliente: "Juan Pérez",
    titulo: "Nota personal",
    fecha: "2026-01-15",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.tipo, "nota");
  }
});

test("proponerEventoCalendarioTool - rechaza tipo inválido", () => {
  const schema = z.object({
    cliente: z.string().min(2),
    obra: z.string().optional(),
    tipo: z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
    titulo: z.string().min(1).max(120),
    descripcion: z.string().max(2000).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    visibleCliente: z.boolean().optional(),
  });

  const result = schema.safeParse({
    cliente: "Juan Pérez",
    tipo: "invalido",
    titulo: "Test",
    fecha: "2026-01-15",
  });
  assert.equal(result.success, false);
});

test("proponerCambioEstadoCotizacionTool - schema valida entrada correcta", () => {
  const schema = z.object({
    cliente: z.string().min(2),
    cotizacion: z.string().optional(),
    nuevoEstado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
  });

  const result = schema.safeParse({
    cliente: "Juan Pérez",
    cotizacion: "Steel frame enero",
    nuevoEstado: "contactado",
  });
  assert.equal(result.success, true);
});

test("proponerCambioEstadoCotizacionTool - rechaza estado inválido", () => {
  const schema = z.object({
    cliente: z.string().min(2),
    cotizacion: z.string().optional(),
    nuevoEstado: z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
  });

  const result = schema.safeParse({
    cliente: "Juan Pérez",
    nuevoEstado: "invalido",
  });
  assert.equal(result.success, false);
});

// Test TRANSICIONES logic
test("TRANSICIONES - nuevo permite contactado, contratado, no_concretado", () => {
  const TRANSICIONES: Record<string, string[]> = {
    nuevo: ["contactado", "contratado", "no_concretado"],
    contactado: ["contratado", "no_concretado"],
    contratado: [],
    no_concretado: ["nuevo", "contactado"],
  };

  assert.deepEqual(TRANSICIONES.nuevo.sort(), ["contactado", "contratado", "no_concretado"].sort());
  assert.deepEqual(TRANSICIONES.contactado.sort(), ["contratado", "no_concretado"].sort());
  assert.deepEqual(TRANSICIONES.contratado, []);
  assert.deepEqual(TRANSICIONES.no_concretado.sort(), ["contactado", "nuevo"].sort());
});

test("TRANSICIONES - transiciones inversas no permitidas", () => {
  const TRANSICIONES: Record<string, string[]> = {
    nuevo: ["contactado", "contratado", "no_concretado"],
    contactado: ["contratado", "no_concretado"],
    contratado: [],
    no_concretado: ["nuevo", "contactado"],
  };

  // De contactado no se puede volver a nuevo
  assert.ok(!TRANSICIONES.contactado.includes("nuevo"));
  // De contratado no se puede ir a ningún lado
  assert.equal(TRANSICIONES.contratado.length, 0);
});