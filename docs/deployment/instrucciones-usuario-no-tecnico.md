# Guía para Usuarios No Técnicos: Configuración y Uso de Herramientas MCP Externas

Esta guía te ayudará a configurar y utilizar las herramientas de servidores externos MCP en la plataforma de asistentes virtuales, sin necesidad de conocimientos técnicos avanzados.

## Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Descarga e Instalación](#descarga-e-instalación)
3. [Configuración Básica](#configuración-básica)
4. [Configuración del Servidor MCP Externo](#configuración-del-servidor-mcp-externo)
5. [Uso de la Interfaz](#uso-de-la-interfaz)
6. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

## Requisitos Previos

Necesitarás:

- Una computadora con Windows, Mac o Linux
- Conexión a Internet
- [Node.js](https://nodejs.org/) (versión 14 o superior) - Descarga e instala la versión "LTS"
- Una clave API de OpenAI (puedes obtenerla en [platform.openai.com](https://platform.openai.com/))

## Descarga e Instalación

### Paso 1: Descarga del Proyecto

1. Abre tu navegador y ve a https://github.com/Pac00n/asistentes-ia-v02
2. Haz clic en el botón verde "Code"
3. Selecciona "Download ZIP"
4. Descomprime el archivo en una carpeta de tu elección

### Paso 2: Instalación de Dependencias

1. Abre la aplicación "Terminal" (Mac/Linux) o "Símbolo del sistema" (Windows)
2. Navega a la carpeta donde descomprimiste el proyecto:
   ```
   cd ruta/a/la/carpeta/asistentes-ia-v02
   ```
3. Instala las dependencias necesarias:
   ```
   npm install
   ```
   (Este proceso puede tardar varios minutos)

## Configuración Básica

### Paso 1: Configuración de Variables de Entorno

1. En la carpeta del proyecto, crea un archivo llamado `.env.local`
2. Abre este archivo con cualquier editor de texto (Bloc de notas, TextEdit, etc.)
3. Añade la siguiente línea, reemplazando `tu_clave_api_aqui` con tu clave API de OpenAI:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=tu_clave_api_aqui
   ```

### Paso 2: Configuración del Servidor MCP Externo de Ejemplo

Para facilitar las pruebas, configuraremos un servidor MCP de ejemplo que se ejecutará en tu computadora:

1. Crea una nueva carpeta llamada `mcp-test-server` dentro de la carpeta del proyecto
2. Dentro de esta carpeta, crea un archivo llamado `package.json` y copia el siguiente contenido:
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

3. Crea otro archivo llamado `server.js` en la misma carpeta y copia el siguiente contenido:
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

4. Abre una nueva ventana de Terminal o Símbolo del sistema
5. Navega a la carpeta `mcp-test-server`:
   ```
   cd ruta/a/la/carpeta/asistentes-ia-v02/mcp-test-server
   ```
6. Instala las dependencias del servidor:
   ```
   npm install
   ```
7. Inicia el servidor:
   ```
   node server.js
   ```
   Deberías ver un mensaje: "Servidor MCP de prueba ejecutándose en http://0.0.0.0:3001"
   (Mantén esta ventana abierta mientras uses la aplicación)

### Paso 3: Configuración de la Conexión al Servidor MCP

1. Vuelve a editar el archivo `.env.local` en la carpeta principal del proyecto
2. Añade la siguiente línea (asegúrate de que esté en una línea nueva, después de la clave de OpenAI):
   ```
   MCP_SERVERS_CONFIG='[{"id":"local","url":"http://localhost:3001","name":"Servidor Local"}]'
   ```

## Inicio de la Aplicación

1. Abre una nueva ventana de Terminal o Símbolo del sistema
2. Navega a la carpeta principal del proyecto:
   ```
   cd ruta/a/la/carpeta/asistentes-ia-v02
   ```
3. Inicia la aplicación:
   ```
   npm run dev
   ```
4. Espera a que aparezca un mensaje similar a:
   ```
   ready - started server on 0.0.0.0:3000, url: http://localhost:3000
   ```
5. Abre tu navegador y ve a: http://localhost:3000

## Uso de la Interfaz

### Acceso a la Página de Asistentes

1. En la página principal, haz clic en "Asistentes" en el menú superior
2. Verás dos tarjetas de asistentes:
   - **Asistente Señalizado**: Utiliza el asistente de OpenAI estándar
   - **MCP v4**: Utiliza herramientas de servidores externos MCP

### Uso del Asistente MCP v4

1. Haz clic en la tarjeta "MCP v4"
2. Serás dirigido a la interfaz de chat
3. Prueba las herramientas externas con estos ejemplos:
   - Para la calculadora: "¿Puedes calcular 25 * 16?"
   - Para el clima: "¿Cuál es el clima en Madrid?"
4. El asistente utilizará automáticamente las herramientas del servidor MCP externo para responder

## Solución de Problemas Comunes

### El servidor MCP no se inicia

**Síntoma**: Mensaje de error al iniciar el servidor MCP

**Solución**:
1. Asegúrate de que no haya otro programa usando el puerto 3001
2. Verifica que hayas instalado correctamente las dependencias con `npm install`
3. Comprueba que los archivos `package.json` y `server.js` tengan el contenido exacto mostrado arriba

### La aplicación principal no se inicia

**Síntoma**: Mensaje de error al ejecutar `npm run dev`

**Solución**:
1. Asegúrate de que Node.js esté instalado correctamente
2. Verifica que hayas ejecutado `npm install` en la carpeta principal
3. Comprueba que el archivo `.env.local` exista y tenga el formato correcto

### Las herramientas externas no funcionan

**Síntoma**: El asistente no utiliza las herramientas externas o muestra errores

**Solución**:
1. Verifica que el servidor MCP esté ejecutándose (deberías ver mensajes de log cuando haces preguntas)
2. Comprueba que la configuración en `.env.local` sea correcta
3. Reinicia tanto el servidor MCP como la aplicación principal
4. Asegúrate de hacer preguntas que claramente requieran el uso de las herramientas (como los ejemplos proporcionados)

### Errores de conexión

**Síntoma**: Mensajes de error de conexión rechazada

**Solución**:
1. Asegúrate de que ambos programas (servidor MCP y aplicación principal) estén ejecutándose
2. Verifica que no haya un firewall bloqueando las conexiones locales
3. Intenta cambiar `localhost` por `127.0.0.1` en la configuración si sigues teniendo problemas

## Siguientes Pasos

Una vez que hayas verificado que todo funciona correctamente, puedes:

1. Explorar otras herramientas y funcionalidades
2. Personalizar el servidor MCP para añadir tus propias herramientas
3. Conectar con servidores MCP externos reales cambiando la configuración en `.env.local`

¡Disfruta usando tu plataforma de asistentes con herramientas externas!
