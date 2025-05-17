// sse_server.js - Servidor MCP usando HTTP con SSE
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const MCPMonitor = require('./monitor'); // Importar el sistema de monitorización

const app = express();
const PORT = 3456;

// Inicializar el sistema de monitorización
const monitor = new MCPMonitor();

// API Key para autenticación (normalmente se almacenaría en variables de entorno)
const API_KEY = 'mcp-weather-service-api-key-2025';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(monitor.middleware()); // Añadir middleware de monitorización

// Middleware de autenticación
const authenticateApiKey = (req, res, next) => {
  // Omitir verificación para el endpoint de estado
  if (req.path === '/status') {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    console.log(`Intento de acceso no autorizado: ${req.path} - API Key: ${apiKey || 'no proporcionada'}`);
    return res.status(401).json({ error: 'API Key no válida o no proporcionada' });
  }
  
  next();
};

// Aplicar middleware de autenticación
app.use(authenticateApiKey);

// Configuración del servidor MCP
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

// Endpoint para verificar estado
app.get('/status', (req, res) => {
  res.json({
    status: 'ready',
    server_info: {
      id: serverConfig.id,
      name: serverConfig.name,
      version: serverConfig.version
    },
    metrics: monitor.getMetricsSummary() // Incluir métricas en la respuesta de estado
  });
});

// Endpoint para métricas detalladas
app.get('/metrics', (req, res) => {
  // Verificar autenticación incluso para métricas
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'API Key no válida o no proporcionada' });
  }
  
  res.json(monitor.metrics);
});

// Endpoint para listar herramientas disponibles
app.get('/tools', (req, res) => {
  res.json({
    tools: serverConfig.tools
  });
});

// Endpoint para ejecutar una herramienta
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const parameters = req.body;
  
  console.log(`SSE Server: Solicitud para ejecutar ${toolName} con parámetros:`, parameters);
  
  // Verificar que la herramienta existe
  const tool = serverConfig.tools.find(t => t.name === toolName);
  if (!tool) {
    return res.status(404).json({
      error: `Herramienta no encontrada: ${toolName}`
    });
  }
  
  try {
    if (toolName === 'get_weather_forecast') {
      const result = await getWeatherForecast(parameters);
      // Registrar la ejecución de la herramienta en el monitor
      monitor.logToolExecution(toolName, parameters, result);
      res.json({ result });
    } else {
      res.status(400).json({
        error: `Herramienta no soportada: ${toolName}`
      });
    }
  } catch (error) {
    console.error(`Error ejecutando herramienta ${toolName}:`, error);
    res.status(500).json({
      error: `Error ejecutando herramienta ${toolName}: ${error.message}`
    });
  }
});

// Implementación del pronóstico del tiempo
async function getWeatherForecast(params) {
  const { location, unit = 'celsius' } = params;
  
  // Verificar parámetros requeridos
  if (!location) {
    throw new Error('Location is required for weather forecast.');
  }
  
  console.log(`Simulando pronóstico del tiempo para ${location}`);
  
  // Generar valores aleatorios para simular
  const weatherTypes = ['Sunny', 'Cloudy', 'Rainy', 'Partly cloudy', 'Thunderstorm', 'Snowy', 'Foggy'];
  const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  const randomTemp = Math.floor(Math.random() * 30) + (unit === 'fahrenheit' ? 40 : 5);
  const randomHumidity = Math.floor(Math.random() * 60) + 30;
  const randomWind = Math.floor(Math.random() * 20) + 1;
  
  // Crear una respuesta simulada con un poco de personalización basada en la ubicación
  return {
    forecast: `${randomWeather} for ${location} (SSE Server)`,
    temperature: `${randomTemp}°${unit === 'fahrenheit' ? 'F' : 'C'}`,
    humidity: `${randomHumidity}%`,
    wind_speed: `${randomWind} ${unit === 'fahrenheit' ? 'mph' : 'm/s'}`,
    location: location
  };
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor MCP (SSE) para pronóstico del tiempo iniciado en http://localhost:${PORT}`);
  console.log('Para registrarlo en Supabase, usa la URL: http://localhost:3456');
});
