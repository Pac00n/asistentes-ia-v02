-- Registrar servidor MCP usando protocolo SSE
INSERT INTO mcp_servers (name, description, type, active, params)
VALUES (
  'Servicio de Clima SSE',
  'Servidor MCP para pronóstico del tiempo usando protocolo SSE (HTTP)',
  'sse',
  true,
  '{"url": "http://localhost:3456", "api_key": ""}'
)
RETURNING id AS server_id;

-- Nota: Usa el ID devuelto para insertar la herramienta a continuación
-- Reemplaza 'UUID-DEVUELTO-POR-CONSULTA-ANTERIOR' con el UUID generado

-- Insertar la herramienta de pronóstico del tiempo
INSERT INTO mcp_tools (server_id, name, description, parameters)
VALUES (
  'UUID-DEVUELTO-POR-CONSULTA-ANTERIOR', -- Reemplazar con el UUID generado
  'get_weather_forecast',
  'Obtiene el pronóstico del tiempo para una ubicación.',
  '{
    "type": "object",
    "required": ["location"],
    "properties": {
      "location": {
        "type": "string",
        "description": "La ciudad y estado, ej. San Francisco, CA"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "Unidad de temperatura"
      }
    }
  }'
);
