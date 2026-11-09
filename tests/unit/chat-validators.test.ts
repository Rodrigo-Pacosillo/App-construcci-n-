import { test } from "node:test";
import assert from "node:assert/strict";
import { chatMensajeSchema, chatInicioSchema, conocimientoSchema } from "../../src/lib/validators/chat";

test("chatMensajeSchema - valida mensaje válido", () => {
  const result = chatMensajeSchema.safeParse({
    mensaje: "Hola, ¿cómo estás?",
    sessionId: "sesion-123",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.mensaje, "Hola, ¿cómo estás?");
    assert.equal(result.data.sessionId, "sesion-123");
  }
});

test("chatMensajeSchema - rechaza mensaje vacío", () => {
  const result = chatMensajeSchema.safeParse({
    mensaje: "",
    sessionId: "sesion-123",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.message.includes("vacio")));
  }
});

test("chatMensajeSchema - rechaza mensaje > 1000 caracteres", () => {
  const result = chatMensajeSchema.safeParse({
    mensaje: "a".repeat(1001),
    sessionId: "sesion-123",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.message.includes("1000")));
  }
});

test("chatMensajeSchema - rechaza sessionId vacío", () => {
  const result = chatMensajeSchema.safeParse({
    mensaje: "Hola",
    sessionId: "",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.message.includes("requerido")));
  }
});

test("chatMensajeSchema - rechaza sessionId faltante", () => {
  const result = chatMensajeSchema.safeParse({
    mensaje: "Hola",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.path.includes("sessionId")));
  }
});

test("chatInicioSchema - valida __INICIO__", () => {
  const result = chatInicioSchema.safeParse({
    mensaje: "__INICIO__",
    sessionId: "sesion-123",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.mensaje, "__INICIO__");
    assert.equal(result.data.sessionId, "sesion-123");
  }
});

test("chatInicioSchema - valida __INICIO__ sin sessionId", () => {
  const result = chatInicioSchema.safeParse({
    mensaje: "__INICIO__",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.mensaje, "__INICIO__");
    assert.equal(result.data.sessionId, undefined);
  }
});

test("chatInicioSchema - rechaza mensaje diferente a __INICIO__", () => {
  const result = chatInicioSchema.safeParse({
    mensaje: "Hola",
  });
  assert.equal(result.success, false);
});

test("conocimientoSchema - valida entrada completa", () => {
  const result = conocimientoSchema.safeParse({
    titulo: "Cómo funciona steel frame",
    categoria: "construccion",
    audiencia: "publico",
    contenido: "El steel frame es un sistema...",
    activo: true,
  });
  assert.equal(result.success, true);
});

test("conocimientoSchema - valida con activo por defecto", () => {
  const result = conocimientoSchema.safeParse({
    titulo: "Test",
    categoria: "test",
    audiencia: "cliente",
    contenido: "Contenido test",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.activo, true);
  }
});

test("conocimientoSchema - rechaza audiencia inválida", () => {
  const result = conocimientoSchema.safeParse({
    titulo: "Test",
    categoria: "test",
    audiencia: "invalido",
    contenido: "Contenido",
  });
  assert.equal(result.success, false);
});

test("conocimientoSchema - rechaza campos vacíos", () => {
  const result = conocimientoSchema.safeParse({
    titulo: "",
    categoria: "",
    audiencia: "publico",
    contenido: "",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.message.includes("requerido")));
  }
});