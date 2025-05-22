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
exports.newsTool = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// Definir el esquema Zod
const newsSchema = zod_1.z.object({
    category: zod_1.z.string().optional().describe("Categoría de noticias (ej: business, technology, sports)"),
    country: zod_1.z.string().optional().describe("Código de país (ej: us, es, mx)")
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
exports.newsTool = {
    meta: {
        name: "get_news_headlines",
        description: "Obtiene titulares de noticias recientes",
        parameters: newsParameters,
    },
    run(_a) {
        return __awaiter(this, arguments, void 0, function* ({ category = "general", country = "us" }) {
            var _b;
            try {
                // Normalizar parámetros
                const normalizedCategory = (category === null || category === void 0 ? void 0 : category.toLowerCase()) || "general";
                const normalizedCountry = (country === null || country === void 0 ? void 0 : country.toLowerCase()) || "us";
                // Usando GNews API (gratuita con límites)
                const { data } = yield axios_1.default.get("https://gnews.io/api/v4/top-headlines", {
                    params: {
                        token: "9b0d5d0f5e4c4f1f8d9c6b0f5e4c4f1f", // Token gratuito con límites
                        lang: normalizedCountry === "es" ? "es" : "en",
                        country: normalizedCountry,
                        category: normalizedCategory,
                        max: 5
                    },
                });
                // Extraer y formatear titulares
                const headlines = ((_b = data.articles) === null || _b === void 0 ? void 0 : _b.map((article) => {
                    var _a;
                    return ({
                        title: article.title,
                        description: article.description,
                        source: ((_a = article.source) === null || _a === void 0 ? void 0 : _a.name) || "Desconocido",
                        url: article.url,
                        publishedAt: article.publishedAt,
                        image: article.image
                    });
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
            }
            catch (error) {
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
        });
    },
};
