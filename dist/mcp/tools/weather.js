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
exports.weatherTool = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// Definir el esquema Zod
const weatherSchema = zod_1.z.object({
    city: zod_1.z.string().describe("Nombre de la ciudad")
});
// Convertir manualmente el esquema a JSON plano compatible con OpenAI
const weatherParameters = {
    type: "object",
    properties: {
        city: {
            type: "string",
            description: "Nombre de la ciudad"
        }
    },
    required: ["city"]
};
exports.weatherTool = {
    meta: {
        name: "get_weather",
        description: "Obtiene el pronóstico del tiempo para una ciudad específica",
        parameters: weatherParameters,
    },
    run(_a) {
        return __awaiter(this, arguments, void 0, function* ({ city }) {
            try {
                // Usando Open-Meteo API (gratuita, sin key)
                const { data } = yield axios_1.default.get("https://api.open-meteo.com/v1/forecast", {
                    params: {
                        latitude: 40.416775, // Default Madrid (se actualizará con geocoding)
                        longitude: -3.703790,
                        current: ["temperature_2m", "relative_humidity_2m", "weather_code", "wind_speed_10m"],
                        timezone: "auto",
                    },
                });
                // Intentar obtener coordenadas reales de la ciudad mediante geocoding
                try {
                    const geoResponse = yield axios_1.default.get("https://geocoding-api.open-meteo.com/v1/search", {
                        params: { name: city, count: 5, language: 'en' } // Aumentamos count a 5
                    });
                    if (geoResponse.data.results && geoResponse.data.results.length > 0) {
                        let location = geoResponse.data.results[0]; // Por defecto el primer resultado
                        // Intentar encontrar una coincidencia en USA
                        const usLocation = geoResponse.data.results.find((loc) => loc.country_code === "US" && loc.name.toLowerCase().includes(city.toLowerCase().split(",")[0]));
                        if (usLocation) {
                            location = usLocation;
                        }
                        // Nueva petición con coordenadas correctas
                        const weatherResponse = yield axios_1.default.get("https://api.open-meteo.com/v1/forecast", {
                            params: {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                current: ["temperature_2m", "relative_humidity_2m", "weather_code", "wind_speed_10m"],
                                timezone: "auto",
                            },
                        });
                        data.current = weatherResponse.data.current;
                        data.location_name = `${location.name}, ${location.country}`;
                    }
                }
                catch (geoError) {
                    console.error("Error en geocoding:", geoError);
                    // Continuar con las coordenadas por defecto
                }
                // Mapear códigos de clima a condiciones legibles
                const weatherConditions = {
                    0: "Cielo despejado",
                    1: "Mayormente despejado",
                    2: "Parcialmente nublado",
                    3: "Nublado",
                    45: "Niebla",
                    48: "Niebla con escarcha",
                    51: "Llovizna ligera",
                    53: "Llovizna moderada",
                    55: "Llovizna intensa",
                    61: "Lluvia ligera",
                    63: "Lluvia moderada",
                    65: "Lluvia intensa",
                    71: "Nevada ligera",
                    73: "Nevada moderada",
                    75: "Nevada intensa",
                    95: "Tormenta",
                    96: "Tormenta con granizo ligero",
                    99: "Tormenta con granizo intenso"
                };
                const weatherCode = data.current.weather_code;
                const weatherCondition = weatherConditions[weatherCode] || "Condición desconocida";
                return {
                    location: data.location_name || city,
                    temperature: `${data.current.temperature_2m} ${data.current_units.temperature_2m}`,
                    condition: weatherCondition,
                    humidity: `${data.current.relative_humidity_2m}${data.current_units.relative_humidity_2m}`,
                    wind_speed: `${data.current.wind_speed_10m} ${data.current_units.wind_speed_10m}`,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                console.error("Error en get_weather:", error);
                return { error: "No se pudo obtener el pronóstico del tiempo" };
            }
        });
    },
};
