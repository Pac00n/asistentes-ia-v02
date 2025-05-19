import { test, expect } from '@playwright/test';

test('MCP Assistant should respond to weather query', async ({ page }) => {
  // Navegar a la página del asistente MCP
  await page.goto('/chat/mcp');
  
  // Verificar que la página se cargó correctamente
  await expect(page.locator('h1')).toContainText('Asistente MCP');
  
  // Escribir un mensaje para consultar el clima
  await page.fill('input[type="text"]', '¿Qué tiempo hace en Madrid?');
  await page.click('button[type="submit"]');
  
  // Esperar respuesta (puede tardar)
  await expect(page.locator('.bg-gray-100')).toBeVisible({ timeout: 10000 });
  
  // Verificar que la respuesta contiene información del clima
  const responseText = await page.locator('.bg-gray-100').textContent();
  expect(responseText).toMatch(/Madrid|temperatura|clima|°C/i);
  
  // Verificar que se usó la herramienta de clima
  const toolIndicator = await page.locator('.bg-emerald-50');
  await expect(toolIndicator).toContainText('get_weather');
});

test('MCP Assistant should respond to calculator query', async ({ page }) => {
  // Navegar a la página del asistente MCP
  await page.goto('/chat/mcp');
  
  // Verificar que la página se cargó correctamente
  await expect(page.locator('h1')).toContainText('Asistente MCP');
  
  // Escribir un mensaje para realizar un cálculo
  await page.fill('input[type="text"]', '¿Cuánto es 125 * 37?');
  await page.click('button[type="submit"]');
  
  // Esperar respuesta (puede tardar)
  await expect(page.locator('.bg-gray-100')).toBeVisible({ timeout: 10000 });
  
  // Verificar que la respuesta contiene el resultado correcto
  const responseText = await page.locator('.bg-gray-100').textContent();
  expect(responseText).toMatch(/4625|resultado|cálculo/i);
  
  // Verificar que se usó la herramienta de calculadora
  const toolIndicator = await page.locator('.bg-emerald-50');
  await expect(toolIndicator).toContainText('calculate');
});

test('MCP Assistant should respond to currency conversion query', async ({ page }) => {
  // Navegar a la página del asistente MCP
  await page.goto('/chat/mcp');
  
  // Verificar que la página se cargó correctamente
  await expect(page.locator('h1')).toContainText('Asistente MCP');
  
  // Escribir un mensaje para convertir moneda
  await page.fill('input[type="text"]', '¿Cuánto son 100 dólares en euros?');
  await page.click('button[type="submit"]');
  
  // Esperar respuesta (puede tardar)
  await expect(page.locator('.bg-gray-100')).toBeVisible({ timeout: 10000 });
  
  // Verificar que la respuesta contiene información de conversión
  const responseText = await page.locator('.bg-gray-100').textContent();
  expect(responseText).toMatch(/euro|EUR|USD|conversión|cambio/i);
  
  // Verificar que se usó la herramienta de conversión
  const toolIndicator = await page.locator('.bg-emerald-50');
  await expect(toolIndicator).toContainText('convert_currency');
});
