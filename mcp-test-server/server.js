// Servidor MCP de prueba simple
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Definición de herramientas disponibles
const tools = [
  {
    toolName: "calculator",
    description: "Calculadora que evalúa expresiones matemáticas",
    parametersSchema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Expresión matemática a evaluar"
        }
      },
      required: ["expression"]
    }
  },
  {
    toolName: "weather",
    description: "Obtiene información del clima para una ciudad",
    parametersSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Nombre de la ciudad"
        }
      },
      required: ["city"]
    }
  }
];

// Endpoint para listar herramientas disponibles
app.get('/tools', (req, res) => {
  console.log('GET /tools - Solicitud recibida');
  res.json(tools);
});

// Endpoint para ejecutar herramientas
app.post('/execute', (req, res) => {
  const { toolName, arguments: args } = req.body;
  console.log(`POST /execute - Herramienta: ${toolName}, Argumentos:`, args);

  if (!toolName) {
    return res.status(400).json({ error: "Se requiere el nombre de la herramienta" });
  }

  // Ejecutar la herramienta según su nombre
  switch (toolName) {
    case "calculator":
      if (!args.expression) {
        return res.status(400).json({ error: "Se requiere una expresión matemática" });
      }
      try {
        // Evaluación segura de expresiones matemáticas simples
        const result = eval(args.expression);
        return res.json({ result });
      } catch (error) {
        return res.status(400).json({ error: "Error al evaluar la expresión: " + error.message });
      }

    case "weather":
      if (!args.city) {
        return res.status(400).json({ error: "Se requiere el nombre de una ciudad" });
      }
      // Simulación de datos del clima
      const weatherData = {
        city: args.city,
        temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
        condition: ["soleado", "nublado", "lluvioso", "ventoso"][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 60) + 30 // 30-90%
      };
      return res.json(weatherData);

    default:
      return res.status(404).json({ error: `Herramienta '${toolName}' no encontrada` });
  }
});

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor MCP de prueba funcionando correctamente');
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor MCP de prueba ejecutándose en http://0.0.0.0:${port}`);
});