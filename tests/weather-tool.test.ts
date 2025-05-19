import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherTool } from '@/lib/mcp/tools/weather';
import axios from 'axios';

// Mock de axios
vi.mock('axios');

describe('Weather Tool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return weather data for a valid city', async () => {
    // Configurar mocks para geocoding y clima
    (axios.get as any).mockImplementation((url) => {
      if (url.includes('geocoding-api')) {
        return Promise.resolve({
          data: {
            results: [{
              name: 'Madrid',
              country: 'España',
              latitude: 40.416775,
              longitude: -3.703790
            }]
          }
        });
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve({
          data: {
            current: {
              temperature_2m: 22.5,
              relative_humidity_2m: 45,
              weather_code: 0,
              wind_speed_10m: 3.5
            },
            current_units: {
              temperature_2m: '°C',
              relative_humidity_2m: '%',
              wind_speed_10m: 'km/h'
            }
          }
        });
      }
    });
    
    // Ejecutar herramienta
    const result = await weatherTool.run({ city: 'Madrid' });
    
    // Verificar resultado
    expect(result).toHaveProperty('location', 'Madrid, España');
    expect(result).toHaveProperty('temperature', '22.5 °C');
    expect(result).toHaveProperty('condition', 'Cielo despejado');
    expect(result).toHaveProperty('humidity', '45%');
    expect(result).toHaveProperty('timestamp');
  });
  
  it('should handle geocoding errors gracefully', async () => {
    // Configurar mock para simular error en geocoding pero éxito en clima
    (axios.get as any).mockImplementation((url) => {
      if (url.includes('geocoding-api')) {
        return Promise.reject(new Error('Geocoding API Error'));
      } else if (url.includes('api.open-meteo.com')) {
        return Promise.resolve({
          data: {
            current: {
              temperature_2m: 20,
              relative_humidity_2m: 50,
              weather_code: 1,
              wind_speed_10m: 4
            },
            current_units: {
              temperature_2m: '°C',
              relative_humidity_2m: '%',
              wind_speed_10m: 'km/h'
            }
          }
        });
      }
    });
    
    // Ejecutar herramienta
    const result = await weatherTool.run({ city: 'Madrid' });
    
    // Verificar que se usaron coordenadas por defecto
    expect(result).toHaveProperty('temperature', '20 °C');
    expect(result).toHaveProperty('condition', 'Mayormente despejado');
    expect(result).not.toHaveProperty('error');
  });
  
  it('should handle complete API failure gracefully', async () => {
    // Configurar mock para simular error completo
    (axios.get as any).mockRejectedValue(new Error('API Error'));
    
    // Ejecutar herramienta
    const result = await weatherTool.run({ city: 'InvalidCity' });
    
    // Verificar manejo de error
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('No se pudo obtener');
  });
});
