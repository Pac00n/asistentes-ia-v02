import { z } from "zod";
import axios from "axios";

// Definir el esquema Zod
const newsSchema = z.object({
  category: z.string().optional().describe("Categoría de noticias (ej: business, technology, sports)"),
  country: z.string().optional().describe("Código de país (ej: us, es, mx)")
});

// Convertir manualmente el esquema a JSON plano compatible con OpenAI
const newsParameters = {
  type: "object",
  properties: {
    category: {
      type: "string",
      description: "Categoría de noticias (ej: business, technology, sports)"
    },
    country: {
      type: "string",
      description: "Código de país (ej: us, es, mx)"
    }
  }
};

export const newsTool = {
  meta: {
    name: "get_news_headlines",
    description: "Obtiene titulares de noticias recientes",
    parameters: newsParameters,
  },
  async run({ category = "general", country = "us" }: { category?: string, country?: string }) {
    try {
      // Normalizar parámetros
      const normalizedCategory = category?.toLowerCase() || "general";
      const normalizedCountry = country?.toLowerCase() || "us";
      
      // Usando GNews API (gratuita con límites)
      const { data } = await axios.get("https://gnews.io/api/v4/top-headlines", {
        params: {
          token: "9b0d5d0f5e4c4f1f8d9c6b0f5e4c4f1f", // Token gratuito con límites
          lang: normalizedCountry === "es" ? "es" : "en",
          country: normalizedCountry,
          category: normalizedCategory,
          max: 5
        },
      });
      
      // Extraer y formatear titulares
      const headlines = data.articles?.map((article: any) => ({
        title: article.title,
        description: article.description,
        source: article.source?.name || "Desconocido",
        url: article.url,
        publishedAt: article.publishedAt,
        image: article.image
      })) || [];
      
      // Si no hay resultados, proporcionar un mensaje informativo
      if (headlines.length === 0) {
        return {
          category: normalizedCategory,
          country: normalizedCountry,
          message: "No se encontraron titulares para la categoría y país especificados",
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        category: normalizedCategory,
        country: normalizedCountry,
        headlines,
        timestamp: new Date().toISOString(),
        source: "GNews API"
      };
    } catch (error) {
      console.error("Error en get_news_headlines:", error);
      
      // Proporcionar titulares de respaldo en caso de error
      return { 
        error: "No se pudieron obtener los titulares de noticias",
        details: error instanceof Error ? error.message : "Error desconocido",
        fallback_headlines: [
          {
            title: "Error al obtener titulares",
            description: "No se pudieron recuperar los titulares debido a un problema técnico. Intenta más tarde.",
            source: "Sistema",
            url: "#",
            publishedAt: new Date().toISOString()
          }
        ]
      };
    }
  },
};
