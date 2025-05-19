import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currencyTool } from '@/lib/mcp/tools/currency';
import axios from 'axios';

// Mock de axios
vi.mock('axios');

describe('Currency Tool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should convert currency correctly', async () => {
    // Configurar mock para API de divisas
    (axios.get as any).mockResolvedValue({
      data: {
        rates: {
          EUR: 0.85,
          GBP: 0.75,
          JPY: 110.5
        }
      }
    });
    
    // Ejecutar herramienta para convertir USD a EUR
    const result = await currencyTool.run({ 
      amount: 100, 
      from: 'USD', 
      to: 'EUR' 
    });
    
    // Verificar resultado
    expect(result).toHaveProperty('amount', 100);
    expect(result).toHaveProperty('from', 'USD');
    expect(result).toHaveProperty('to', 'EUR');
    expect(result).toHaveProperty('rate', 0.85);
    expect(result).toHaveProperty('result', '85.00');
    expect(result).toHaveProperty('timestamp');
  });
  
  it('should handle invalid currency codes gracefully', async () => {
    // Configurar mock para API de divisas
    (axios.get as any).mockResolvedValue({
      data: {
        rates: {
          EUR: 0.85,
          GBP: 0.75
        }
      }
    });
    
    // Ejecutar herramienta con código de moneda inválido
    const result = await currencyTool.run({ 
      amount: 100, 
      from: 'USD', 
      to: 'XYZ' // Código inválido
    });
    
    // Verificar manejo de error
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('No se pudo realizar la conversión');
  });
  
  it('should handle API errors gracefully', async () => {
    // Configurar mock para simular error
    (axios.get as any).mockRejectedValue(new Error('API Error'));
    
    // Ejecutar herramienta
    const result = await currencyTool.run({ 
      amount: 100, 
      from: 'USD', 
      to: 'EUR' 
    });
    
    // Verificar manejo de error
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('No se pudo realizar la conversión');
  });
  
  it('should validate input parameters', async () => {
    // Ejecutar herramienta con cantidad inválida
    const result = await currencyTool.run({ 
      amount: NaN, 
      from: 'USD', 
      to: 'EUR' 
    });
    
    // Verificar validación de parámetros
    expect(result).toHaveProperty('error');
    expect(result.details).toContain('cantidad debe ser un número válido');
  });
});
