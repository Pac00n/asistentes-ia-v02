# Servicio MCP de Búsqueda Web

Este es un servicio MCP (Model Context Protocol) que proporciona capacidades de búsqueda web a través de Server-Sent Events (SSE).

## Características

- Implementa el protocolo SSE para comunicación con el cliente
- Proporciona una herramienta `web_search` para realizar búsquedas en la web
- Incluye métricas y monitorización del servicio
- Autenticación mediante API key
- Limitación de tasa para prevenir abusos

## Instalación

1. Asegúrate de tener Node.js instalado (v14+)
2. Instala las dependencias requeridas:

```bash
cd examples/mcp_servers/web_search_service
npm install express cors uuid axios express-rate-limit dotenv
```

## Configuración

Puedes configurar el servicio mediante variables de entorno:

- `PORT`: Puerto en el que se ejecutará el servidor (por defecto: 3458)
- `WEB_SEARCH_API_KEY`: API key para autenticar las peticiones (por defecto: 'demo_api_key')

## Inicio del Servidor

Para iniciar el servidor:

```bash
node start-server.js
```

## Registro en Supabase

El script `register_server.sql` registra el servicio y su herramienta en la base de datos Supabase.
Para ejecutarlo, puedes usar la interfaz SQL de Supabase o ejecutarlo directamente desde tu aplicación.

## Endpoints

### Información del Servidor

- `GET /health`: Comprueba el estado del servidor
- `GET /metrics`: Obtiene métricas del servidor (peticiones, éxitos, errores)
- `GET /tools`: Lista las herramientas disponibles

### Ejecución de Herramientas

- `POST /execute`: Ejecuta la herramienta de búsqueda web

Ejemplo de petición:

```json
{
  "tool_name": "web_search",
  "arguments": {
    "query": "clima en Madrid",
    "num_results": 5
  }
}
```

Encabezados requeridos:
- `x-api-key`: Tu API key para autenticación

## Respuesta SSE

El servidor envía eventos en formato SSE:

1. `tool_call_start`: Al iniciar la ejecución
2. `tool_call_end`: Al completar la ejecución (éxito o error)

## Integración con el Asistente

Esta herramienta permite a los asistentes de IA buscar información actualizada en internet, complementando otras herramientas como el servicio de clima.

## Consideraciones para Producción

Para un entorno de producción se recomienda:

1. Implementar un servicio real de búsqueda (Google Custom Search, Bing, etc.)
2. Mejorar la seguridad de la API key (rotación, restricciones por IP)
3. Añadir logging detallado y monitorización
4. Configurar reglas de CORS más restrictivas

## Pruebas

Para probar el servidor manualmente:

```bash
curl -X GET http://localhost:3458/tools -H "x-api-key: demo_api_key"
```

Para ejecutar una búsqueda:

```bash
curl -X POST http://localhost:3458/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: demo_api_key" \
  -d '{"tool_name":"web_search","arguments":{"query":"noticias tecnología","num_results":3}}'
```
