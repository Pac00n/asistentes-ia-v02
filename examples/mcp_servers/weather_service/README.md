# Servidor MCP de Pronóstico del Tiempo

Este es un servidor MCP de ejemplo que implementa el protocolo stdio para proporcionar pronósticos del tiempo. Puede funcionar en dos modos:

1. **Modo Real**: Conectándose a la API de OpenWeatherMap (requiere una API key)
2. **Modo Simulado**: Generando datos simulados de clima (no requiere API key)

## Requisitos

- Node.js 16+
- npm o yarn

## Instalación

```bash
cd examples/mcp_servers/weather_service
npm install
```

## Uso

### Iniciar el servidor

```bash
# Con API key (opcional)
OPENWEATHER_API_KEY=your_api_key npm start

# Sin API key (modo simulado)
npm start
```

### Comunicación con el servidor MCP

El servidor implementa el protocolo stdio, recibiendo comandos JSON en stdin y respondiendo con JSON en stdout. Los errores se registran en stderr.

#### Comandos disponibles

1. **hello**: Verifica que el servidor esté listo
   ```json
   {"id":"req_1","action":"hello"}
   ```

2. **list_tools**: Obtiene las herramientas disponibles
   ```json
   {"id":"req_2","action":"list_tools"}
   ```

3. **call_tool**: Ejecuta una herramienta
   ```json
   {"id":"req_3","action":"call_tool","data":{"tool_name":"get_weather_forecast","parameters":{"location":"Barcelona, Spain","unit":"celsius"}}}
   ```

## Herramientas disponibles

### get_weather_forecast

Obtiene el pronóstico del tiempo para una ubicación.

**Parámetros**:
- `location` (obligatorio): Ciudad y país/estado (ej. "Barcelona, Spain")
- `unit` (opcional): Unidad de temperatura ("celsius" o "fahrenheit")

**Respuesta**:
```json
{
  "forecast": "Sunny - clear sky",
  "temperature": "25°C",
  "humidity": "60%",
  "wind_speed": "5 m/s",
  "location": "Barcelona, ES"
}
```

## Integración con MCPAdapter

Para usar este servidor con el `MCPAdapter` de la aplicación principal, agrega un registro en la tabla `mcp_servers` de Supabase con:

- `type`: "stdio"
- `connection_info`: JSON con `{"command": "node", "args": ["path/to/examples/mcp_servers/weather_service/index.js"]}`
