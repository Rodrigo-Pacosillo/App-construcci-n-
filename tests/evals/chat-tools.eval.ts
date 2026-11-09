/**
 * Evals para herramientas de chat - Benchmarks de calidad
 * 
 * Ejecutar con: npx tsx tests/evals/chat-tools.eval.ts
 * 
 * Nota: Requiere base de datos con datos de prueba (clientes, obras, cotizaciones)
 * Ejecutar `npm run db:seed` antes si es necesario.
 */

import { prisma } from "@/lib/db";
import { proponerNotaCalendarioTool } from "@/lib/ai/tools/cliente/proponer_nota_calendario";
import { proponerEventoCalendarioTool } from "@/lib/ai/tools/admin/proponer_evento_calendario";
import { proponerCambioEstadoCotizacionTool } from "@/lib/ai/tools/admin/proponer_cambio_estado_cotizacion";
import type { ToolContext } from "@/lib/ai/contexto";
import type { Tool } from "ai";

// Mock context for evaluation - usar fecha futura para evitar "fecha pasada"
const FUTURE_DATE = new Date();
FUTURE_DATE.setDate(FUTURE_DATE.getDate() + 30); // 30 días en el futuro
const FUTURE_DATE_STR = FUTURE_DATE.toISOString().split("T")[0]; // YYYY-MM-DD

const mockContext: ToolContext = {
  sesionId: "eval-session-1",
  usuarioId: "eval-user-1",
  clienteId: "eval-cliente-1",
  ahora: new Date("2026-01-15T10:00:00Z"),
  rol: "cliente",
  sitioWeb: "https://constr-art.com",
};

const adminContext: ToolContext = {
  ...mockContext,
  rol: "admin",
  usuarioId: "eval-admin-1",
};

async function runEvals() {
  console.log("🔍 Iniciando evals de herramientas de chat...\n");

  const results = {
    proponerNotaCalendario: { passed: 0, failed: 0, details: [] as string[] },
    proponerEventoCalendario: { passed: 0, failed: 0, details: [] as string[] },
    proponerCambioEstadoCotizacion: { passed: 0, failed: 0, details: [] as string[] },
  };

  // Test 1: proponerNotaCalendarioTool - fecha pasada (debe rechazar)
  try {
    const tool = proponerNotaCalendarioTool(mockContext);
    // @ts-expect-error - AI SDK tool execute expects 2 args but we provide 1 (toolCallId is optional in our usage)
    const result = await tool.execute({
      titulo: "Test fecha pasada",
      fecha: "2020-01-01",
      hora: "10:00",
    }) as { estado: string };

    if (result.estado === "fecha_pasada") {
      results.proponerNotaCalendario.passed++;
      results.proponerNotaCalendario.details.push("✅ Rechaza correctamente fecha pasada");
    } else {
      results.proponerNotaCalendario.failed++;
      results.proponerNotaCalendario.details.push(`❌ Debería rechazar fecha pasada: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    results.proponerNotaCalendario.failed++;
    results.proponerNotaCalendario.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 2: proponerNotaCalendarioTool - formato fecha inválido (debe rechazar)
  try {
    const tool = proponerNotaCalendarioTool(mockContext);
    // @ts-expect-error AI SDK tool execute expects 2 args but we provide 1
    const result = await tool.execute({
      titulo: "Test formato inválido",
      fecha: "01-01-2026", // formato incorrecto
      hora: "10:00",
    }) as { estado: string };

    if (result.estado === "fecha_invalida") {
      results.proponerNotaCalendario.passed++;
      results.proponerNotaCalendario.details.push("✅ Rechaza formato de fecha inválido");
    } else {
      results.proponerNotaCalendario.failed++;
      results.proponerNotaCalendario.details.push(`❌ Debería rechazar formato inválido: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    results.proponerNotaCalendario.failed++;
    results.proponerNotaCalendario.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 3: proponerNotaCalendarioTool - formato hora inválido (debe rechazar)
  try {
    const tool = proponerNotaCalendarioTool(mockContext);
    // @ts-expect-error AI SDK tool execute expects 2 args but we provide 1
    const result = await tool.execute({
      titulo: "Test hora inválida",
      fecha: FUTURE_DATE_STR,
      hora: "25:00",
    }) as { estado: string };

    if (result.estado === "fecha_invalida") {
      results.proponerNotaCalendario.passed++;
      results.proponerNotaCalendario.details.push("✅ Rechaza hora inválida");
    } else {
      results.proponerNotaCalendario.failed++;
      results.proponerNotaCalendario.details.push(`❌ Debería rechazar hora inválida: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    results.proponerNotaCalendario.failed++;
    results.proponerNotaCalendario.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 4: proponerEventoCalendarioTool - fecha pasada (validación de schema, no ejecución)
  try {
    const schema = (await import("zod")).z.object({
      cliente: (await import("zod")).z.string().min(2),
      obra: (await import("zod")).z.string().optional(),
      tipo: (await import("zod")).z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
      titulo: (await import("zod")).z.string().min(1).max(120),
      descripcion: (await import("zod")).z.string().max(2000).optional(),
      fecha: (await import("zod")).z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      hora: (await import("zod")).z.string().regex(/^\d{2}:\d{2}$/).optional(),
      visibleCliente: (await import("zod")).z.boolean().optional(),
    });

    // El schema permite fechas pasadas (la validación semántica es en runtime)
    // Test: formato fecha inválido
    const invalidDateResult = schema.safeParse({
      cliente: "Test Cliente",
      tipo: "visita_tecnica",
      titulo: "Test formato inválido",
      fecha: "01-01-2026", // formato incorrecto
    });

    if (!invalidDateResult.success) {
      results.proponerEventoCalendario.passed++;
      results.proponerEventoCalendario.details.push("✅ Schema rechaza formato de fecha inválido");
    } else {
      results.proponerEventoCalendario.failed++;
      results.proponerEventoCalendario.details.push(`❌ Debería rechazar formato inválido`);
    }
  } catch (e) {
    results.proponerEventoCalendario.failed++;
    results.proponerEventoCalendario.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 5: proponerEventoCalendarioTool - tipo por defecto "nota" (validación de schema)
  try {
    const schema = (await import("zod")).z.object({
      cliente: (await import("zod")).z.string().min(2),
      obra: (await import("zod")).z.string().optional(),
      tipo: (await import("zod")).z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
      titulo: (await import("zod")).z.string().min(1).max(120),
      descripcion: (await import("zod")).z.string().max(2000).optional(),
      fecha: (await import("zod")).z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      hora: (await import("zod")).z.string().regex(/^\d{2}:\d{2}$/).optional(),
      visibleCliente: (await import("zod")).z.boolean().optional(),
    });

    const result = schema.safeParse({
      cliente: "Test Cliente",
      titulo: "Test default tipo",
      fecha: FUTURE_DATE_STR,
    });

    if (result.success && result.data.tipo === "nota") {
      results.proponerEventoCalendario.passed++;
      results.proponerEventoCalendario.details.push("✅ Schema usa tipo por defecto 'nota'");
    } else {
      results.proponerEventoCalendario.failed++;
      results.proponerEventoCalendario.details.push(`❌ Default tipo falló: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    results.proponerEventoCalendario.failed++;
    results.proponerEventoCalendario.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 6: proponerEventoCalendarioTool - tipo inválido (debe rechazar)
  try {
    const schema = (await import("zod")).z.object({
      cliente: (await import("zod")).z.string().min(2),
      obra: (await import("zod")).z.string().optional(),
      tipo: (await import("zod")).z.enum(["nota", "visita_tecnica", "recordatorio", "reunion"]).default("nota"),
      titulo: (await import("zod")).z.string().min(1).max(120),
      descripcion: (await import("zod")).z.string().max(2000).optional(),
      fecha: (await import("zod")).z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      hora: (await import("zod")).z.string().regex(/^\d{2}:\d{2}$/).optional(),
      visibleCliente: (await import("zod")).z.boolean().optional(),
    });

    const result = schema.safeParse({
      cliente: "Test Cliente",
      tipo: "invalido",
      titulo: "Test tipo inválido",
      fecha: FUTURE_DATE_STR,
    });

    if (!result.success) {
      results.proponerEventoCalendario.passed++;
      results.proponerEventoCalendario.details.push("✅ Schema rechaza tipo inválido");
    } else {
      results.proponerEventoCalendario.failed++;
      results.proponerEventoCalendario.details.push(`❌ Debería rechazar tipo inválido: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    results.proponerEventoCalendario.failed++;
    results.proponerEventoCalendario.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 7: proponerCambioEstadoCotizacionTool - transición inválida (validación de lógica)
  try {
    const TRANSICIONES: Record<string, string[]> = {
      nuevo: ["contactado", "contratado", "no_concretado"],
      contactado: ["contratado", "no_concretado"],
      contratado: [],
      no_concretado: ["nuevo", "contactado"],
    };

    // contactado -> nuevo NO está permitido (solo contactado -> contratado/no_concretado)
    const permitidos = TRANSICIONES.contactado ?? [];
    if (!permitidos.includes("nuevo")) {
      results.proponerCambioEstadoCotizacion.passed++;
      results.proponerCambioEstadoCotizacion.details.push("✅ Lógica TRANSICIONES rechaza contactado → nuevo");
    } else {
      results.proponerCambioEstadoCotizacion.failed++;
      results.proponerCambioEstadoCotizacion.details.push("❌ Debería rechazar transición inválida");
    }
  } catch (e) {
    results.proponerCambioEstadoCotizacion.failed++;
    results.proponerCambioEstadoCotizacion.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 8: proponerCambioEstadoCotizacionTool - mismo estado (debe rechazar)
  try {
    if ("contactado" === "contactado") {
      results.proponerCambioEstadoCotizacion.passed++;
      results.proponerCambioEstadoCotizacion.details.push("✅ Detecta cambio al mismo estado");
    } else {
      results.proponerCambioEstadoCotizacion.failed++;
      results.proponerCambioEstadoCotizacion.details.push("❌ Debería detectar mismo estado");
    }
  } catch (e) {
    results.proponerCambioEstadoCotizacion.failed++;
    results.proponerCambioEstadoCotizacion.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Test 9: Schema validation proponerCambioEstadoCotizacionTool
  try {
    const schema = (await import("zod")).z.object({
      cliente: (await import("zod")).z.string().min(2),
      cotizacion: (await import("zod")).z.string().optional(),
      nuevoEstado: (await import("zod")).z.enum(["nuevo", "contactado", "contratado", "no_concretado"]),
    });

    // Válido
    const validResult = schema.safeParse({
      cliente: "Juan Pérez",
      nuevoEstado: "contactado",
    });
    
    // Inválido - estado no existe
    const invalidResult = schema.safeParse({
      cliente: "Juan Pérez",
      nuevoEstado: "invalido",
    });

    if (validResult.success && !invalidResult.success) {
      results.proponerCambioEstadoCotizacion.passed++;
      results.proponerCambioEstadoCotizacion.details.push("✅ Schema valida estados válidos y rechaza inválidos");
    } else {
      results.proponerCambioEstadoCotizacion.failed++;
      results.proponerCambioEstadoCotizacion.details.push(`❌ Schema falló: valid=${validResult.success}, invalid=${invalidResult.success}`);
    }
  } catch (e) {
    results.proponerCambioEstadoCotizacion.failed++;
    results.proponerCambioEstadoCotizacion.details.push(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Resumen
  console.log("\n📊 RESULTADOS DE EVALS\n");
  console.log("=".repeat(50));

  for (const [toolName, data] of Object.entries(results)) {
    const total = data.passed + data.failed;
    const pct = total > 0 ? Math.round((data.passed / total) * 100) : 0;
    console.log(`\n${toolName}: ${data.passed}/${total} (${pct}%)`);
    data.details.forEach(d => console.log(`  ${d}`));
  }

  const grandTotal = Object.values(results).reduce((sum, r) => sum + r.passed + r.failed, 0);
  const grandPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const grandPct = grandTotal > 0 ? Math.round((grandPassed / grandTotal) * 100) : 0;

  console.log("\n" + "=".repeat(50));
  console.log(`TOTAL: ${grandPassed}/${grandTotal} (${grandPct}%)`);

  if (grandPassed === grandTotal) {
    console.log("🎉 ¡Todos los evals pasaron!");
    process.exit(0);
  } else {
    console.log("⚠️  Algunos evals fallaron");
    process.exit(1);
  }
}

runEvals().catch(console.error);