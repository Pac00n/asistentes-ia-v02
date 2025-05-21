"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchTool = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// Definir el esquema Zod
const searchSchema = zod_1.z.object({
    query: zod_1.z.string().describe("Consulta de búsqueda")
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
exports.searchTool = {
    meta: {
        name: "search_web",
        description: "Busca información en la web",
        parameters: searchParameters,
    },
    run(_a) {
        return __awaiter(this, arguments, void 0, function* ({ query }) {
            try {
                // Usando DuckDuckGo API (gratuita, sin key)
                const encodedQuery = encodeURIComponent(query);
                const { data } = yield axios_1.default.get(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&pretty=1`);
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
                    data.RelatedTopics.slice(0, 5).forEach((topic) => {
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
            }
            catch (error) {
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
        });
    },
};
