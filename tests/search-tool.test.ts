import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchTool } from '@/lib/mcp/tools/search';
import axios from 'axios';

// Mock de axios
vi.mock('axios');

describe('Search Tool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return search results for a valid query', async () => {
    // Configurar mock para DuckDuckGo API
    (axios.get as any).mockResolvedValue({
      data: {
        Heading: "Inteligencia Artificial",
        AbstractText: "La inteligencia artificial es la simulación de procesos de inteligencia humana por parte de máquinas.",
        AbstractURL: "https://example.com/ai",
        AbstractSource: "Wikipedia",
        RelatedTopics: [
          {
            Text: "Machine Learning - Subcampo de la inteligencia artificial",
            FirstURL: "https://example.com/ml"
          },
          {
            Text: "Deep Learning - Técnicas de aprendizaje profundo",
            FirstURL: "https://example.com/dl"
          }
        ]
      }
    });
    
    // Ejecutar herramienta
    const result = await searchTool.run({ query: 'inteligencia artificial' });
    
    // Verificar resultado
    expect(result).toHaveProperty('query', 'inteligencia artificial');
    expect(result).toHaveProperty('results');
    expect(result.results).toBeInstanceOf(Array);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]).toHaveProperty('title', 'Inteligencia Artificial');
    expect(result.results[0]).toHaveProperty('snippet');
    expect(result.results[0]).toHaveProperty('link');
    expect(result).toHaveProperty('timestamp');
  });
  
  it('should handle empty results gracefully', async () => {
    // Configurar mock para resultados vacíos
    (axios.get as any).mockResolvedValue({
      data: {
        Heading: "",
        AbstractText: "",
        RelatedTopics: []
      }
    });
    
    // Ejecutar herramienta
    const result = await searchTool.run({ query: 'consulta sin resultados' });
    
    // Verificar manejo de resultados vacíos
    expect(result).toHaveProperty('results');
    expect(result.results).toBeInstanceOf(Array);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]).toHaveProperty('title', 'No se encontraron resultados específicos');
  });
  
  it('should handle API errors gracefully', async () => {
    // Configurar mock para simular error
    (axios.get as any).mockRejectedValue(new Error('API Error'));
    
    // Ejecutar herramienta
    const result = await searchTool.run({ query: 'consulta con error' });
    
    // Verificar manejo de error
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('fallback_results');
    expect(result.fallback_results).toBeInstanceOf(Array);
    expect(result.fallback_results.length).toBeGreaterThan(0);
  });
});
