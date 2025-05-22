# Guía de Implementación y Despliegue de MCP v4

## Introducción

Este documento proporciona una guía completa para implementar y desplegar la integración de herramientas de servidores externos MCP (Multi-Capability Processor) en el proyecto asistentes-ia-v02. La integración permite a los asistentes virtuales utilizar herramientas alojadas en servidores externos para ampliar sus capacidades.

## Requisitos previos

- Node.js 18.x o superior
- npm 8.x o superior
- Una clave API válida de OpenAI
- Acceso a un servidor MCP externo o capacidad para implementar uno localmente

## Estructura del proyecto

La integración de MCP v4 se compone de los siguientes elementos principales:

1. **Cliente MCP**: Ubicado en `lib/mcp/client.ts`, gestiona la comunicación con servidores MCP externos.
2. **Página de asistentes**: En `app/assistants/page.tsx`, muestra las tarjetas de los asistentes disponibles.
3. **Interfaz de chat**: En `app/chat/mcpv4/[assistantId]/page.tsx`, proporciona la interfaz de usuario para interactuar con el asistente MCP v4.
4. **Servidor MCP de prueba**: Implementación de referencia de un servidor MCP para pruebas y desarrollo.

## Pasos de implementación

### 1. Configuración del entorno

1. Clone el repositorio:
   ```bash
   git clone https://github.com/Pac00n/asistentes-ia-v02.git
   cd asistentes-ia-v02
   git checkout feat/add-echo-tool-example
   ```

2. Instale las dependencias:
   ```bash
   npm install
   ```

3. Cree un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=su_clave_api_de_openai
   MCP_SERVERS_CONFIG='[{"id":"local","url":"http://localhost:3001","name":"Servidor Local"}]'
   ```

### 2. Implementación del servidor MCP de prueba

1. Cree una carpeta para el servidor MCP:
   ```bash
   mkdir -p mcp-test-server
   cd mcp-test-server
   ```

2. Cree un archivo `package.json`:
   ```json
   {
     "name": "mcp-test-server",
     "version": "1.0.0",
     "description": "Servidor MCP de prueba",
     "main": "server.js",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5"
     }
   }
   ```

3. Cree un archivo `server.js` con la implementación del servidor MCP:
   ```javascript
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
   ```

4. Instale las dependencias e inicie el servidor:
   ```bash
   npm install
   node server.js
   ```

### 3. Verificación de la implementación

1. Inicie la aplicación:
   ```bash
   cd ..  # Volver a la raíz del proyecto
   npm run dev
   ```

2. Abra un navegador y vaya a http://localhost:3000/assistants
3. Verifique que la tarjeta "MCP v4" aparece en la lista de asistentes
4. Haga clic en la tarjeta para acceder a la interfaz de chat
5. Pruebe la integración con mensajes como:
   - "¿Puedes calcular 25 * 16?"
   - "¿Cuál es el clima en Madrid?"

## Despliegue en producción

### 1. Preparación para producción

1. Asegúrese de tener una clave API válida de OpenAI en el archivo `.env.local`
2. Verifique que el servidor MCP externo esté accesible desde la aplicación

### 2. Construcción para producción

```bash
npm run build
```

### 3. Inicio del servidor de producción

```bash
npm start
```

## Configuración de servidores MCP externos

Para configurar servidores MCP externos adicionales, modifique la variable `MCP_SERVERS_CONFIG` en el archivo `.env.local`:

```
MCP_SERVERS_CONFIG='[
  {"id":"local","url":"http://localhost:3001","name":"Servidor Local"},
  {"id":"production","url":"https://su-servidor-mcp.com","name":"Servidor de Producción"}
]'
```

## Solución de problemas

### Error de API key inválida

Si recibe un error indicando que la API key de OpenAI es inválida:

1. Verifique que la clave API en `.env.local` sea correcta y esté activa
2. Asegúrese de que la clave tenga los permisos necesarios para utilizar los modelos de asistentes
3. Compruebe que no haya excedido los límites de uso de la API

### Error de conexión con el servidor MCP

Si no puede conectarse al servidor MCP:

1. Verifique que el servidor MCP esté en ejecución
2. Compruebe que la URL en `MCP_SERVERS_CONFIG` sea correcta
3. Asegúrese de que no haya restricciones de CORS que bloqueen las solicitudes

## Recursos adicionales

- [Documentación de la API de OpenAI](https://platform.openai.com/docs/api-reference)
- [Especificación del protocolo MCP](https://mcpservers.org/resources)
- [Ejemplos de implementación de servidores MCP](https://mcpservers.org/remote-servers)

## Contacto y soporte

Para obtener ayuda adicional, contacte al equipo de desarrollo o consulte la documentación en línea en https://github.com/Pac00n/asistentes-ia-v02.
