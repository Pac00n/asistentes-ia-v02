# Implementación de un Servidor MCP

Este documento detalla cómo implementar un servidor MCP compatible con la integración desarrollada.

## Estructura Básica de un Servidor MCP

Un servidor MCP debe implementar al menos dos endpoints principales:

1. **GET /tools**: Para descubrir las herramientas disponibles
2. **POST /execute**: Para ejecutar una herramienta específica

## Ejemplo de Implementación con Express

A continuación se muestra un ejemplo completo de un servidor MCP implementado con Node.js y Express:

```javascript
// Servidor MCP de ejemplo
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
  
  // Verificar autenticación si es necesario
  const apiKey = req.headers['x-api-key'];
  if (process.env.REQUIRE_API_KEY && apiKey !== process.env.EXPECTED_API_KEY) {
    return res.status(401).json({ error: "API key inválida o no proporcionada" });
  }
  
  res.json(tools);
});

// Endpoint para ejecutar herramientas
app.post('/execute', (req, res) => {
  const { toolName, arguments: args } = req.body;
  console.log(`POST /execute - Herramienta: ${toolName}, Argumentos:`, args);

  // Verificar autenticación si es necesario
  const apiKey = req.headers['x-api-key'];
  if (process.env.REQUIRE_API_KEY && apiKey !== process.env.EXPECTED_API_KEY) {
    return res.status(401).json({ error: "API key inválida o no proporcionada" });
  }

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
        // En producción, considera usar una biblioteca como math.js para mayor seguridad
        const result = eval(args.expression);
        return res.json({ result });
      } catch (error) {
        return res.status(400).json({ error: "Error al evaluar la expresión: " + error.message });
      }

    case "weather":
      if (!args.city) {
        return res.status(400).json({ error: "Se requiere el nombre de una ciudad" });
      }
      
      // En un servidor real, aquí se conectaría a una API de clima
      // Este es solo un ejemplo simulado
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
  res.send('Servidor MCP funcionando correctamente');
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor MCP ejecutándose en http://0.0.0.0:${port}`);
});
```

## Despliegue del Servidor MCP

### Requisitos

- Node.js 14.x o superior
- npm o yarn

### Pasos para el Despliegue

1. Crea un directorio para tu servidor MCP:
   ```bash
   mkdir mi-servidor-mcp
   cd mi-servidor-mcp
   ```

2. Inicializa el proyecto:
   ```bash
   npm init -y
   ```

3. Instala las dependencias:
   ```bash
   npm install express cors
   ```

4. Crea el archivo `server.js` con el código de ejemplo anterior.

5. Inicia el servidor:
   ```bash
   node server.js
   ```

6. Para producción, considera usar PM2 o un servicio similar:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "mcp-server"
   ```

## Integración con la Aplicación Principal

Una vez desplegado tu servidor MCP, configura la aplicación principal para que se conecte a él:

1. Edita la variable de entorno `MCP_SERVERS_CONFIG` en tu archivo `.env.local` o en tu plataforma de despliegue:

```
MCP_SERVERS_CONFIG='[{"id":"mi_servidor","url":"http://tu-servidor-mcp.com","name":"Mi Servidor MCP","apiKey":"tu_api_key_si_es_necesaria"}]'
```

2. Reinicia la aplicación principal para que cargue la nueva configuración.

## Consideraciones de Seguridad

1. **Validación de Entrada**: Valida cuidadosamente todos los argumentos recibidos.
2. **Evaluación Segura**: Evita usar `eval()` en producción. Utiliza bibliotecas seguras como `math.js` para evaluación matemática.
3. **Rate Limiting**: Implementa límites de tasa para prevenir abusos.
4. **Autenticación**: Utiliza API keys o tokens JWT para autenticar las solicitudes.
5. **HTTPS**: Asegúrate de que tu servidor utilice HTTPS en producción.

## Monitorización

Considera implementar monitorización para tu servidor MCP:

```javascript
// Ejemplo de endpoint de estado para monitorización
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

## Escalabilidad

Para escalar tu servidor MCP:

1. **Balanceo de Carga**: Utiliza un balanceador de carga como Nginx o HAProxy.
2. **Contenedores**: Considera usar Docker para facilitar el despliegue y la escalabilidad.
3. **Caché**: Implementa caché para respuestas frecuentes.

## Ejemplo de Docker

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
```

Construye y ejecuta con:

```bash
docker build -t mcp-server .
docker run -p 3001:3001 -e REQUIRE_API_KEY=true -e EXPECTED_API_KEY=tu_api_key mcp-server
```
