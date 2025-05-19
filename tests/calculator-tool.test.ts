import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculatorTool } from '@/lib/mcp/tools/calculator';

describe('Calculator Tool', () => {
  it('should correctly calculate simple expressions', async () => {
    // Probar suma
    let result = await calculatorTool.run({ expression: '2 + 2' });
    expect(result).toHaveProperty('result', '4');
    
    // Probar resta
    result = await calculatorTool.run({ expression: '10 - 5' });
    expect(result).toHaveProperty('result', '5');
    
    // Probar multiplicación
    result = await calculatorTool.run({ expression: '3 * 4' });
    expect(result).toHaveProperty('result', '12');
    
    // Probar división
    result = await calculatorTool.run({ expression: '20 / 4' });
    expect(result).toHaveProperty('result', '5');
    
    // Probar expresión compleja
    result = await calculatorTool.run({ expression: '(2 + 3) * (4 - 1) / 3' });
    expect(result).toHaveProperty('result', '5');
  });
  
  it('should sanitize potentially dangerous expressions', async () => {
    // Expresión con caracteres no permitidos
    const result = await calculatorTool.run({ expression: '2 + 2; console.log("hack")' });
    
    // Verificar que se sanitizó correctamente
    expect(result).toHaveProperty('sanitized_expression', '2 + 2');
    expect(result).toHaveProperty('result', '4');
  });
  
  it('should handle invalid expressions gracefully', async () => {
    // Expresión inválida
    const result = await calculatorTool.run({ expression: '2 +' });
    
    // Verificar manejo de error
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('No se pudo realizar el cálculo');
  });
  
  it('should handle empty or non-string inputs', async () => {
    // Expresión vacía
    let result = await calculatorTool.run({ expression: '' });
    expect(result).toHaveProperty('error');
    
    // Expresión no string (esto debería ser capturado por Zod en producción)
    result = await calculatorTool.run({ expression: null as any });
    expect(result).toHaveProperty('error');
  });
});
