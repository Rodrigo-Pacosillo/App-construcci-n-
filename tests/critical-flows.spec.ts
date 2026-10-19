import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('admin login redirects to /admin', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('client login redirects to /cliente', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'cliente@demo.com');
    await page.fill('input[name="password"]', 'cliente123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/cliente$/);
    await expect(page.locator('h1')).toContainText('RESUMEN');
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Email o contraseña incorrectos')).toBeVisible();
  });
});

test.describe('Cotización Flow', () => {
  test('visitor can submit cotización', async ({ page }) => {
    await page.goto('/cotizacion');
    
    await page.fill('input[name="nombre"]', 'Juan');
    await page.fill('input[name="apellidos"]', 'Pérez');
    await page.fill('input[name="telefono"]', '+591 7 123-4567');
    await page.fill('input[name="email"]', 'juan@test.com');
    await page.selectOption('select[name="tipoObra"]', 'vivienda_nueva');
    await page.selectOption('select[name="tipoConstruccion"]', 'seco');
    await page.selectOption('select[name="rangoM2"]', 'm100_200');
    await page.selectOption('select[name="plazoInicio"]', 'lo_antes_posible');
    await page.fill('input[name="ubicacion"]', 'Santa Cruz, Bolivia');
    await page.fill('textarea[name="descripcion"]', 'Quiero construir una casa de 150m2');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=MUCHAS GRACIAS')).toBeVisible();
    await expect(page.locator('text=Su solicitud fue enviada')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test('admin can access dashboard after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('admin can navigate to cotizaciones', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Cotizaciones")');
    await expect(page).toHaveURL(/\/admin\/cotizaciones$/);
    await expect(page.locator('h1')).toContainText('Cotizaciones');
  });
});

test.describe('Client Portal', () => {
  test('client can access portal after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'cliente@demo.com');
    await page.fill('input[name="password"]', 'cliente123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/cliente$/);
    await expect(page.locator('h1')).toContainText('RESUMEN');
  });

  test('client can view cotizaciones', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'cliente@demo.com');
    await page.fill('input[name="password"]', 'cliente123');
    await page.click('button[type="submit"]');
    
    await page.click('a:has-text("Cotizaciones")');
    await expect(page).toHaveURL(/\/cliente\/cotizaciones$/);
    await expect(page.locator('h1')).toContainText('Mis cotizaciones');
  });
});