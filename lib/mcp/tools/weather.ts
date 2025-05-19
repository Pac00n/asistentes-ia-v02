import { z } from "zod";
import axios from "axios";

// Definir el esquema Zod
const weatherSchema = z.object({
  city: z.string().describe("Nombre de la ciudad")
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

export const weatherTool = {
  meta: {
    name: "get_weather",
    description: "Obtiene el pronóstico del tiempo para una ciudad específica",
    parameters: weatherParameters,
  },
  async run({ city }: { city: string }) {
    try {
      // Usando Open-Meteo API (gratuita, sin key)
      const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
          latitude: 40.416775, // Default Madrid (se actualizará con geocoding)
          longitude: -3.703790,
          current: ["temperature_2m", "relative_humidity_2m", "weather_code", "wind_speed_10m"],
          timezone: "auto",
        },
      });
      
      // Intentar obtener coordenadas reales de la ciudad mediante geocoding
      try {
        const geoResponse = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
          params: { name: city, count: 1 }
        });
        
        if (geoResponse.data.results && geoResponse.data.results.length > 0) {
          const location = geoResponse.data.results[0];
          
          // Nueva petición con coordenadas correctas
          const weatherResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
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
      } catch (geoError) {
        console.error("Error en geocoding:", geoError);
        // Continuar con las coordenadas por defecto
      }
      
      // Mapear códigos de clima a condiciones legibles
      const weatherConditions: Record<number, string> = {
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
    } catch (error) {
      console.error("Error en get_weather:", error);
      return { error: "No se pudo obtener el pronóstico del tiempo" };
    }
  },
};
