import { z } from "zod";
import axios from "axios";

// Definir el esquema Zod
const searchSchema = z.object({
  query: z.string().describe("Consulta de búsqueda")
});

// Convertir manualmente el esquema a JSON plano compatible con OpenAI
const searchParameters = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Consulta de búsqueda"
    }
  },
  required: ["query"]
};

export const searchTool = {
  meta: {
    name: "search_web",
    description: "Busca información en la web",
    parameters: searchParameters,
  },
  async run({ query }: { query: string }) {
    try {
      // Usando DuckDuckGo API (gratuita, sin key)
      const encodedQuery = encodeURIComponent(query);
      const { data } = await axios.get(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&pretty=1`);
      
      // Extraer resultados relevantes
      const results = [];
      
      // Añadir respuesta instantánea si existe
      if (data.AbstractText) {
        results.push({
          title: data.Heading || "Respuesta instantánea",
          snippet: data.AbstractText,
          link: data.AbstractURL || "#",
          source: data.AbstractSource || "DuckDuckGo"
        });
      }
      
      // Añadir resultados relacionados
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text && !topic.Topics) { // Excluir categorías
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text,
              snippet: topic.Text,
              link: topic.FirstURL || "#",
              source: "DuckDuckGo Related"
            });
          }
        });
      }
      
      // Si no hay resultados suficientes, añadir un mensaje
      if (results.length === 0) {
        results.push({
          title: "No se encontraron resultados específicos",
          snippet: `No se encontraron resultados específicos para "${query}". Intenta con otra búsqueda.`,
          link: "#",
          source: "Sistema"
        });
      }
      
      return {
        query,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error en search_web:", error);
      return { 
        error: "No se pudo completar la búsqueda",
        fallback_results: [
          {
            title: "Error en la búsqueda",
            snippet: `No se pudo buscar "${query}" debido a un error técnico. Intenta más tarde.`,
            link: "#",
            source: "Sistema"
          }
        ]
      };
    }
  },
};
