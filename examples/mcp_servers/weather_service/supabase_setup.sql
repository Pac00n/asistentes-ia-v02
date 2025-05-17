-- Script SQL para configurar el servidor MCP de clima en Supabase

-- 1. Insertar el servidor MCP (usando generación automática de UUID)
INSERT INTO mcp_servers (name, description, type, active, params)
VALUES (
  'Servicio de Clima Real',
  'Servidor MCP para pronóstico del tiempo usando protocolo stdio',
  'stdio',
  true,
  '{"command": "node", "args": ["examples/mcp_servers/weather_service/index.js"]}'
)
RETURNING id AS server_id;  -- Esto devolverá el UUID generado para usar en las siguientes consultas

-- 2. Insertar la herramienta de pronóstico del tiempo
-- Nota: Reemplaza 'UUID-DEVUELTO-POR-CONSULTA-ANTERIOR' con el UUID real devuelto por la consulta anterior
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

-- 3. Opcional: Asignar la herramienta al asistente MCP de prueba
INSERT INTO mcp_assistant_tools (assistant_id, tool_id, enabled)
VALUES (
  'mcp-test-assistant', -- ID del asistente de OpenAI que usamos para pruebas
  (SELECT id FROM mcp_tools WHERE server_id = '51af0fa4-de4a-440c-9f49-b32bc55e8928' AND name = 'get_weather_forecast'),
  true
);

-- Para verificar que todo se insertó correctamente:
SELECT s.name as server_name, s.type, t.name as tool_name, t.description
FROM mcp_servers s
JOIN mcp_tools t ON s.id = t.server_id
WHERE s.id = '51af0fa4-de4a-440c-9f49-b32bc55e8928';
