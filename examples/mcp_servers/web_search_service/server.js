// Servidor MCP SSE para el servicio de búsqueda web
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Configuración básica
const app = express();
const PORT = process.env.PORT || 3458;
const API_KEY = process.env.WEB_SEARCH_API_KEY || 'demo_api_key'; 

// Habilitamos CORS y JSON
app.use(cors());
app.use(express.json());

// Middleware para verificar la API key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'API key inválida o no proporcionada' });
  }
  next();
};

// Limitador de peticiones para evitar abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones, intente de nuevo más tarde'
});

// Aplicamos el limitador a todas las rutas
app.use(limiter);

// Estado de salud del servidor
app.get('/health', verifyApiKey, (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Métricas del servidor
let requestCount = 0;
let successCount = 0;
let errorCount = 0;
let lastRequestTime = null;

app.get('/metrics', verifyApiKey, (req, res) => {
  res.json({
    uptime: process.uptime(),
    requestCount,
    successCount,
    errorCount,
    lastRequestTime
  });
});

// Definición de herramientas disponibles
const tools = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Busca información en la web utilizando un motor de búsqueda',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'La consulta de búsqueda que se desea realizar'
          },
          num_results: {
            type: 'number',
            description: 'Número de resultados a devolver (máximo 10)',
            default: 5
          }
        },
        required: ['query']
      }
    }
  }
];

// Listado de herramientas
app.get('/tools', verifyApiKey, (req, res) => {
  res.json({ tools });
});

// Función para simular una búsqueda web (en un entorno real, usaríamos una API como Google o Bing)
async function performWebSearch(query, numResults = 5) {
  // En un entorno real, aquí llamaríamos a una API de búsqueda
  // Por ahora, simulamos resultados para demostración
  
  // Limitamos a un máximo de 10 resultados
  numResults = Math.min(Math.max(1, numResults), 10);
  
  // Simulamos una pequeña latencia para que parezca real
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Generamos resultados ficticios basados en la consulta
  const results = [];
  
  for (let i = 0; i < numResults; i++) {
    results.push({
      title: `Resultado ${i+1} para "${query}"`,
      url: `https://example.com/search/${encodeURIComponent(query)}/result-${i+1}`,
      snippet: `Este es un fragmento de texto que muestra información relacionada con "${query}". Los resultados pueden variar dependiendo de la consulta realizada y otros factores.`,
      position: i+1
    });
  }
  
  return {
    query,
    results,
    total_results_count: numResults,
    search_time: 0.32 // tiempo simulado en segundos
  };
}

// Endpoint para ejecutar la herramienta de búsqueda web
app.post('/execute', verifyApiKey, async (req, res) => {
  try {
    requestCount++;
    lastRequestTime = new Date().toISOString();
    
    const { tool_name, arguments: args } = req.body;
    console.log(`Recibida petición para herramienta: ${tool_name}`);
    console.log(`Argumentos recibidos:`, JSON.stringify(args));
    
    if (tool_name !== 'web_search') {
      errorCount++;
      return res.status(400).json({ 
        error: `Herramienta "${tool_name}" no disponible` 
      });
    }
    
    // Validación de argumentos
    if (!args.query) {
      errorCount++;
      return res.status(400).json({ 
        error: 'Se requiere el argumento "query"' 
      });
    }
    
    // Configuramos el evento SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Enviamos evento de inicio
    const toolCallId = uuidv4();
    res.write(`data: ${JSON.stringify({
      event: "tool_call_start",
      data: {
        tool_call_id: toolCallId,
        tool_name,
        arguments: args
      }
    })}\n\n`);
    
    try {
      // Ejecutamos la búsqueda
      const numResults = args.num_results || 5;
      const searchResults = await performWebSearch(args.query, numResults);
      
      // Enviamos evento de finalización exitosa
      res.write(`data: ${JSON.stringify({
        event: "tool_call_end",
        data: {
          tool_call_id: toolCallId,
          status: "success",
          result: searchResults
        }
      })}\n\n`);
      
      successCount++;
    } catch (error) {
      // Enviamos evento de error
      res.write(`data: ${JSON.stringify({
        event: "tool_call_end",
        data: {
          tool_call_id: toolCallId,
          status: "error",
          error: {
            message: error.message || 'Error durante la búsqueda'
          }
        }
      })}\n\n`);
      
      errorCount++;
    }
    
    // Cerramos la conexión SSE
    res.end();
    
  } catch (error) {
    errorCount++;
    console.error('Error inesperado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor MCP SSE de búsqueda web ejecutándose en http://localhost:${PORT}`);
});
