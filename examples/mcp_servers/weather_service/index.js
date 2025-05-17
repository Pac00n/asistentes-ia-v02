// Servidor MCP para pronóstico del tiempo (ejemplo)
// Implementa el protocolo stdio para comunicarse con el cliente MCP

import { createInterface } from 'readline';
import fetch from 'node-fetch';

// Configuración del servidor
const serverConfig = {
  id: 'weather-service',
  name: 'WeatherService',
  version: '1.0.0',
  tools: [
    {
      name: 'get_weather_forecast',
      description: 'Obtiene el pronóstico del tiempo para una ubicación.',
      parameters: {
        type: 'object',
        required: ['location'],
        properties: {
          location: {
            type: 'string',
            description: 'La ciudad y estado, ej. San Francisco, CA'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Unidad de temperatura'
          }
        }
      }
    }
  ]
};

// API Key para OpenWeatherMap (simularemos si no está presente)
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

// Interfaz para leer de stdin
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Manejador de líneas de stdin
readline.on('line', async (line) => {
  process.stderr.write(`Servidor MCP: Recibida línea: ${line}\n`);
  try {
    // Parsear el comando JSON
    const request = JSON.parse(line);
    process.stderr.write(`Servidor MCP: Solicitud parseada correctamente. ID: ${request.id}, Acción: ${request.action}\n`);
    
    // Procesar la solicitud
    const response = await processRequest(request);
    process.stderr.write(`Servidor MCP: Respuesta generada para ID: ${request.id}\n`);
    
    // Enviar respuesta al cliente
    const responseJSON = JSON.stringify(response);
    process.stderr.write(`Servidor MCP: Enviando respuesta: ${responseJSON.substring(0, 100)}...\n`);
    console.log(responseJSON);
  } catch (error) {
    // Manejar errores de parseo o procesamiento
    process.stderr.write(`Servidor MCP ERROR: ${error.message}\n`);
    console.error(`Error processing request: ${error.message}`);
    console.log(JSON.stringify({
      id: Math.random().toString(36).substring(2, 15),
      error: `Error processing request: ${error.message}`
    }));
  }
});

// Procesar solicitudes
async function processRequest(request) {
  // Verificar formato básico de la solicitud
  if (!request.id || !request.action) {
    return {
      id: request.id || Math.random().toString(36).substring(2, 15),
      error: 'Invalid request format. Must include id and action.'
    };
  }
  
  // Manejar diferentes tipos de acción
  switch (request.action) {
    case 'hello':
      return {
        id: request.id,
        data: {
          status: 'ready',
          server_info: {
            id: serverConfig.id,
            name: serverConfig.name,
            version: serverConfig.version
          }
        }
      };
      
    case 'list_tools':
      return {
        id: request.id,
        data: {
          tools: serverConfig.tools
        }
      };
      
    case 'call_tool':
      return await callTool(request);
      
    default:
      return {
        id: request.id,
        error: `Unknown action: ${request.action}`
      };
  }
}

// Manejar llamadas a herramientas
async function callTool(request) {
  const { tool_name, parameters } = request.data;
  
  // Verificar que la herramienta existe
  const tool = serverConfig.tools.find(t => t.name === tool_name);
  if (!tool) {
    return {
      id: request.id,
      error: `Tool not found: ${tool_name}`
    };
  }
  
  // Manejar la herramienta específica
  try {
    if (tool_name === 'get_weather_forecast') {
      const result = await getWeatherForecast(parameters);
      return {
        id: request.id,
        data: {
          result
        }
      };
    } else {
      return {
        id: request.id,
        error: `Unsupported tool: ${tool_name}`
      };
    }
  } catch (error) {
    return {
      id: request.id,
      error: `Error executing tool ${tool_name}: ${error.message}`
    };
  }
}

// Implementación del pronóstico del tiempo
async function getWeatherForecast(params) {
  const { location, unit = 'celsius' } = params;
  
  // Verificar parámetros requeridos
  if (!location) {
    throw new Error('Location is required for weather forecast.');
  }
  
  // Si tenemos una API key de OpenWeatherMap, usamos la API real
  if (OPENWEATHER_API_KEY) {
    try {
      // Obtener coordenadas del lugar
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error(`Location not found: ${location}`);
      }
      
      const { lat, lon } = geoData[0];
      
      // Obtener pronóstico con las coordenadas
      const units = unit === 'fahrenheit' ? 'imperial' : 'metric';
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`;
      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();
      
      if (weatherData.cod !== 200) {
        throw new Error(`Weather API error: ${weatherData.message}`);
      }
      
      // Formatear respuesta
      return {
        forecast: `${weatherData.weather[0].main} - ${weatherData.weather[0].description}`,
        temperature: `${weatherData.main.temp}°${unit === 'fahrenheit' ? 'F' : 'C'}`,
        humidity: `${weatherData.main.humidity}%`,
        wind_speed: `${weatherData.wind.speed} ${unit === 'fahrenheit' ? 'mph' : 'm/s'}`,
        location: `${weatherData.name}, ${weatherData.sys.country}`
      };
    } catch (error) {
      console.error(`Error fetching real weather data: ${error.message}`);
      // Si falla la API, caemos al pronóstico simulado
    }
  }
  
  // Modo simulado (cuando no hay API key o falló la llamada)
  console.log(`Simulating weather forecast for ${location} (no API key provided).`);
  
  // Generar valores aleatorios para simular
  const weatherTypes = ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy', 'Thunderstorm', 'Snowy', 'Foggy'];
  const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  const randomTemp = Math.floor(Math.random() * 30) + (unit === 'fahrenheit' ? 40 : 5);
  const randomHumidity = Math.floor(Math.random() * 60) + 30;
  const randomWind = Math.floor(Math.random() * 20) + 1;
  
  // Crear una respuesta simulada con un poco de personalización basada en la ubicación
  return {
    forecast: `${randomWeather} for ${location} (Simulated)`,
    temperature: `${randomTemp}°${unit === 'fahrenheit' ? 'F' : 'C'}`,
    humidity: `${randomHumidity}%`,
    wind_speed: `${randomWind} ${unit === 'fahrenheit' ? 'mph' : 'm/s'}`,
    location: location
  };
}

// Notificar que estamos listos - usando stderr para no interferir con el protocolo
process.stderr.write("MCP Weather Service started. Waiting for commands...\n");
