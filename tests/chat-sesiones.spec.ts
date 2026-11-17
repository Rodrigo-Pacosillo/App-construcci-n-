import { test, expect, type Page } from "@playwright/test";
import { prisma } from "../src/lib/db";

/**
 * Regresion de los dos asistentes privados (admin y cliente):
 * - abrir el chat NO crea sesion ni persiste mensajes;
 * - el primer mensaje crea la sesion y le genera un titulo corto;
 * - la fecha es contexto interno y no se muestra en el saludo.
 */
async function verificarChat(
  page: Page,
  email: string,
  password: string,
  dest: RegExp,
  agente: "admin" | "cliente",
  saludo: RegExp,
  mensaje: string
) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  expect(usuario).not.toBeNull();
  const userId = usuario!.id;
  const inicio = new Date(Date.now() - 2000);

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(dest);

  await page.getByRole("button", { name: /Asistente CONSTR-ART/ }).first().click();
  await expect(page.getByText(saludo)).toBeVisible();
  await expect(page.locator('input[placeholder*="primera pregunta"]')).toBeVisible();

  const sesionesDePrueba = () =>
    prisma.chatSesion.findMany({
      where: { usuarioId: userId, agente, creadoEn: { gte: inicio } },
      select: { id: true },
    });

  try {
    await page.waitForTimeout(1000);
    expect(await sesionesDePrueba()).toHaveLength(0);

    const input = page.locator('input[placeholder*="primera pregunta"]');
    await input.fill(mensaje);
    await input.press("Enter");
    await page.waitForResponse(
      (res) => /\/api\/chat$/.test(new URL(res.url()).pathname) && res.request().method() === "POST",
      { timeout: 30000 }
    );

    await expect.poll(async () => {
      const sesiones = await sesionesDePrueba();
      if (!sesiones.length) return null;
      const s = await prisma.chatSesion.findUnique({
        where: { id: sesiones[0].id },
        select: { titulo: true },
      });
      return s?.titulo ?? null;
    }).toBe(mensaje);

    // La sesión aparece en la lista lateral con su título, aunque falle el proveedor de IA.
    await expect(page.getByRole("button", { name: mensaje })).toBeVisible();
    await expect(page.getByText(/Hoy es \d/)).toHaveCount(0);
  } finally {
    const creadas = await sesionesDePrueba();
    await prisma.chatSesion.deleteMany({
      where: { id: { in: creadas.map((s) => s.id) } },
    });
  }
}

test("admin: abre en borrador y titula con el primer mensaje", async ({ page }) => {
  await verificarChat(
    page,
    "admin@gmail.com",
    "admin123",
    /\/admin$/,
    "admin",
    /Soy el asistente del panel/,
    "Consulta de verificacion del panel"
  );
});

test("cliente: abre en borrador y titula con el primer mensaje", async ({ page }) => {
  await verificarChat(
    page,
    "rodrigo@gmail.com",
    "rodrigo55555",
    /\/cliente/,
    "cliente",
    /Soy el asistente de su cuenta/,
    "Consulta de verificacion de mi cuenta"
  );
});
