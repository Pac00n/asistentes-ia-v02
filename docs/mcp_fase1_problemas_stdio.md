# Problemas con la integración MCP (Fase 1) - Protocolo Stdio

## Resumen de la situación

Tras implementar la integración MCP para el asistente de prueba con las herramientas de pronóstico del tiempo, hemos logrado avances significativos pero encontramos un problema específico: la aplicación no se conecta correctamente al servidor MCP real a través del protocolo stdio.

## Estado actual

1. **Base de datos Supabase**: Configurada correctamente con la información del servidor MCP real.
2. **Servidor MCP ficticio**: Funciona correctamente y responde a las solicitudes de la aplicación.
3. **Servidor MCP real (stdio)**: Se inicia correctamente pero no recibe solicitudes desde la aplicación.

## Problemas identificados y correcciones implementadas

1. **Discrepancia en campos de configuración**: Se detectó que el código buscaba `connection_info` mientras que el esquema de base de datos utilizaba `params`. Se actualizó `MCPClientFactory` para usar el campo correcto.

2. **Manejo de mensajes no-JSON**: El `StdioMCPClient` intentaba interpretar todos los mensajes como JSON, incluyendo el mensaje de inicio del servidor. Se modificó para ignorar líneas que no son JSON válido.

3. **Mensajes de inicio del servidor**: Se modificó el servidor MCP para usar `process.stderr.write()` en lugar de `console.error()` para que el mensaje de inicio no interfiera con el protocolo.

4. **Rutas relativas vs absolutas**: Se actualizó la configuración en Supabase para usar rutas absolutas al archivo del servidor MCP en lugar de rutas relativas.

## Comportamiento observado

A pesar de estas correcciones, la aplicación sigue utilizando el servidor ficticio en lugar del real:

- El servidor MCP real se inicia pero no muestra actividad cuando se hacen consultas.
- Los logs de la aplicación muestran el mensaje "Simulating weather forecast" que proviene del servidor ficticio.
- No se observan errores explícitos en los logs relacionados con la conexión al servidor real.

## Próximos pasos para la depuración

1. ✅ Añadir logs más detallados en `StdioMCPClient` para rastrear el proceso de conexión.
2. ✅ Verificar que la ruta absoluta especificada sea accesible desde el contexto de ejecución de la aplicación.
3. Probar con configuraciones alternativas para la inicialización del proceso.
4. Investigar posibles problemas con el manejo de procesos en entornos de desarrollo Next.js.
5. Considerar la implementación del protocolo SSE como alternativa al stdio si los problemas persisten.

## Posibles soluciones

### Solución 1: Envoltorio con script independiente

Podemos crear un script intermediario que se encargue de la comunicación entre la aplicación y el servidor MCP:

```javascript
// wrapper.js
const { spawn } = require('child_process');
const process = require('process');

// Iniciar el servidor MCP
const serverProcess = spawn('node', [
  'examples/mcp_servers/weather_service/index.js'
]);

// Redirigir stdin/stdout entre este proceso y el servidor MCP
process.stdin.pipe(serverProcess.stdin);
serverProcess.stdout.pipe(process.stdout);
serverProcess.stderr.pipe(process.stderr);

// Manejar la terminación
process.on('SIGTERM', () => {
  serverProcess.kill();
  process.exit(0);
});
```

Esta solución simplifica la comunicación de procesos y evita posibles problemas con rutas absolutas o relativas.

### Solución 2: Cambiar a comunicación TCP/IP

Otra alternativa es modificar el servidor MCP para que use comunicación TCP/IP en lugar de stdio:

```javascript
const net = require('net');

const server = net.createServer((socket) => {
  // Manejar conexiones entrantes
  socket.on('data', (data) => {
    // Procesar solicitudes recibidas
    // ...
  });
});

server.listen(3456, '127.0.0.1', () => {
  console.log('MCP Server listening on port 3456');
});
```

Esto permitiría una conexión más estable y clara entre la aplicación y el servidor MCP.

## Notas adicionales

El problema parece estar en la comunicación entre procesos específicamente con el protocolo stdio. La aplicación logra detectar ambos servidores en Supabase, pero falla al establecer una conexión funcional con el servidor real mientras que mantiene la conexión con el servidor ficticio.
