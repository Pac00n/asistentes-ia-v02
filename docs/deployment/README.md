# Documentación de Despliegue para Integración MCP

Esta documentación detalla cómo desplegar y configurar correctamente la integración con servidores MCP externos en un entorno de producción.

## Índice

1. [Arquitectura de la Integración MCP](#arquitectura-de-la-integración-mcp)
2. [Implementación Realizada](#implementación-realizada)
3. [Pasos para Despliegue en Producción](#pasos-para-despliegue-en-producción)
4. [Configuración de Servidores MCP](#configuración-de-servidores-mcp)
5. [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)
6. [Monitorización y Mantenimiento](#monitorización-y-mantenimiento)
7. [Solución de Problemas](#solución-de-problemas)

## Arquitectura de la Integración MCP

La integración con servidores MCP externos se basa en una arquitectura cliente-servidor donde:

1. **McpClient** (`lib/mcp/client.ts`): Actúa como cliente que descubre y ejecuta herramientas de servidores MCP externos.
2. **Servidores MCP**: Implementan el protocolo MCP y exponen herramientas a través de endpoints HTTP.
3. **API de MCPv4** (`app/api/chat/mcpv4/route.ts`): Endpoint que maneja las solicitudes de chat y utiliza McpClient.
4. **Interfaz de Usuario** (`app/chat/mcpv4/[assistantId]/page.tsx`): Página de chat que se comunica con la API de MCPv4.

![Arquitectura MCP](./images/mcp_architecture.png)

## Implementación Realizada

Se ha implementado y validado la integración real con servidores MCP externos, activando las llamadas HTTP que anteriormente estaban simuladas:

1. **Descubrimiento de Herramientas**: Se ha activado la funcionalidad para descubrir herramientas de servidores MCP externos mediante llamadas HTTP reales al endpoint `/tools`.

2. **Ejecución de Herramientas**: Se ha implementado la ejecución de herramientas mediante llamadas HTTP POST al endpoint `/execute` de los servidores MCP.

3. **Manejo de Errores**: Se ha mejorado el manejo de errores para proporcionar mensajes claros y mantener la simulación como fallback en caso de errores de conexión.

4. **Pruebas de Integración**: Se han creado pruebas exhaustivas que validan tanto el descubrimiento como la ejecución de herramientas desde servidores externos.

## Pasos para Despliegue en Producción

### 1. Preparación del Entorno

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Pac00n/asistentes-ia-v02.git
   cd asistentes-ia-v02
   git checkout feat/add-echo-tool-example
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` y añade:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=tu_api_key_de_openai
   MCP_SERVERS_CONFIG='[{"id":"servidor1","url":"https://tu-servidor-mcp.com","name":"Mi Servidor MCP","apiKey":"tu_api_key_si_es_necesaria"}]'
   ```

### 2. Compilación y Despliegue

1. Compila el proyecto:
   ```bash
   npm run build
   ```

2. Inicia el servidor en producción:
   ```bash
   npm start
   ```

   O despliega en Vercel:
   ```bash
   vercel --prod
   ```

### 3. Verificación del Despliegue

1. Accede a la interfaz de chat MCPv4:
   ```
   https://tu-dominio.com/chat/mcpv4/mcp-v4-tools
   ```

2. Prueba la integración con comandos que activen las herramientas externas.

## Configuración de Servidores MCP

### Estructura de Servidores MCP

Los servidores MCP deben implementar los siguientes endpoints:

- `GET /tools`: Devuelve un array de definiciones de herramientas en formato JSON.
- `POST /execute`: Ejecuta una herramienta con los argumentos proporcionados.

### Ejemplo de Servidor MCP

Puedes encontrar un ejemplo de servidor MCP en [mcp-test-server](./mcp-test-server.md).

### Configuración en Variables de Entorno

La variable `MCP_SERVERS_CONFIG` debe contener un array JSON con la configuración de los servidores:

```json
[
  {
    "id": "weather_service",
    "url": "https://my-weather-tool-server.com/api",
    "name": "Weather Service Provider",
    "apiKey": "your_api_key_for_weather_service"
  },
  {
    "id": "calculator_srv",
    "url": "http://localhost:3001/mcp",
    "name": "Local Calculator Server"
  }
]
```

## Seguridad y Mejores Prácticas

### Autenticación y Autorización

1. **API Keys**: Utiliza API keys para autenticar las solicitudes entre tu aplicación y los servidores MCP.
2. **HTTPS**: Asegúrate de que todas las comunicaciones con servidores MCP externos utilicen HTTPS.
3. **Validación de Entrada**: Valida todos los argumentos antes de enviarlos a los servidores MCP.

### Gestión de Errores

1. **Timeouts**: Configura timeouts adecuados para las solicitudes a servidores MCP.
2. **Reintentos**: Implementa una política de reintentos para manejar fallos temporales.
3. **Fallbacks**: Mantén la simulación como fallback para casos críticos donde los servidores no responden.

### Rendimiento

1. **Caché**: Considera implementar caché para las definiciones de herramientas para mejorar el rendimiento.
2. **Conexiones Persistentes**: Utiliza conexiones HTTP persistentes cuando sea posible.
3. **Monitorización**: Implementa métricas para monitorizar el rendimiento de las llamadas a servidores MCP.

## Monitorización y Mantenimiento

### Logs

Asegúrate de que los logs incluyan información suficiente para depurar problemas:

```javascript
console.log(`McpClient: Respuesta recibida de ${server.id} (${toolsUrl}). Estado: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
```

### Métricas

Considera implementar métricas para:
- Tiempo de respuesta de servidores MCP
- Tasa de éxito/error de llamadas
- Número de herramientas descubiertas

### Actualizaciones

Mantén actualizado el cliente MCP con las últimas mejoras y correcciones de seguridad.

## Solución de Problemas

### Problemas Comunes

1. **Error de Conexión**: Verifica que los servidores MCP estén accesibles y que las URLs sean correctas.
2. **Error de Autenticación**: Asegúrate de que las API keys sean válidas y estén correctamente configuradas.
3. **Formato de Respuesta Incorrecto**: Verifica que los servidores MCP devuelvan respuestas en el formato esperado.

### Depuración

Para habilitar logs de depuración más detallados, puedes modificar el nivel de log en el cliente MCP:

```javascript
// En lib/mcp/client.ts
const DEBUG = true; // Cambiar a true para logs detallados
```

---

Para más detalles sobre la implementación de servidores MCP, consulta [implementacion-servidor-mcp.md](./implementacion-servidor-mcp.md).
