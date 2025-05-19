import { describe, it, expect, vi, beforeEach } from 'vitest';
import { newsTool } from '@/lib/mcp/tools/news';
import axios from 'axios';

// Mock de axios
vi.mock('axios');

describe('News Tool', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return news headlines for valid parameters', async () => {
    // Configurar mock para API de noticias
    (axios.get as any).mockResolvedValue({
      data: {
        articles: [
          {
            title: "Noticia importante sobre tecnología",
            description: "Descripción de la noticia tecnológica",
            source: { name: "TechNews" },
            url: "https://example.com/tech-news",
            publishedAt: "2025-05-19T12:00:00Z",
            image: "https://example.com/image.jpg"
          },
          {
            title: "Otra noticia relevante",
            description: "Descripción de otra noticia",
            source: { name: "NewsPortal" },
            url: "https://example.com/other-news",
            publishedAt: "2025-05-19T11:30:00Z",
            image: "https://example.com/image2.jpg"
          }
        ]
      }
    });
    
    // Ejecutar herramienta
    const result = await newsTool.run({ 
      category: "technology", 
      country: "us" 
    });
    
    // Verificar resultado
    expect(result).toHaveProperty('category', 'technology');
    expect(result).toHaveProperty('country', 'us');
    expect(result).toHaveProperty('headlines');
    expect(result.headlines).toBeInstanceOf(Array);
    expect(result.headlines.length).toBe(2);
    expect(result.headlines[0]).toHaveProperty('title', 'Noticia importante sobre tecnología');
    expect(result.headlines[0]).toHaveProperty('source', 'TechNews');
    expect(result).toHaveProperty('timestamp');
  });
  
  it('should handle empty results gracefully', async () => {
    // Configurar mock para resultados vacíos
    (axios.get as any).mockResolvedValue({
      data: {
        articles: []
      }
    });
    
    // Ejecutar herramienta
    const result = await newsTool.run({ 
      category: "nonexistent", 
      country: "xx" 
    });
    
    // Verificar manejo de resultados vacíos
    expect(result).toHaveProperty('category', 'nonexistent');
    expect(result).toHaveProperty('country', 'xx');
    expect(result).toHaveProperty('message');
    expect(result.message).toContain('No se encontraron titulares');
  });
  
  it('should use default parameters when not provided', async () => {
    // Configurar mock para API de noticias
    (axios.get as any).mockResolvedValue({
      data: {
        articles: [
          {
            title: "Noticia por defecto",
            description: "Descripción de noticia",
            source: { name: "DefaultNews" },
            url: "https://example.com/default-news",
            publishedAt: "2025-05-19T10:00:00Z"
          }
        ]
      }
    });
    
    // Ejecutar herramienta sin parámetros
    const result = await newsTool.run({});
    
    // Verificar uso de valores por defecto
    expect(result).toHaveProperty('category', 'general');
    expect(result).toHaveProperty('country', 'us');
    expect(result.headlines).toBeInstanceOf(Array);
    expect(result.headlines.length).toBe(1);
  });
  
  it('should handle API errors gracefully', async () => {
    // Configurar mock para simular error
    (axios.get as any).mockRejectedValue(new Error('API Error'));
    
    // Ejecutar herramienta
    const result = await newsTool.run({ 
      category: "business", 
      country: "es" 
    });
    
    // Verificar manejo de error
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('No se pudieron obtener los titulares');
    expect(result).toHaveProperty('fallback_headlines');
    expect(result.fallback_headlines).toBeInstanceOf(Array);
  });
});
