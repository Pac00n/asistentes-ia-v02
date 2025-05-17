-- Registro del servicio de clima en la tabla de servidores MCP
INSERT INTO mcp_servers (name, url, type, api_key, description, configuration, created_at)
VALUES (
  'Servicio de Clima SSE',
  'http://localhost:3456',
  'sse',
  'demo_api_key',
  'Servicio MCP para obtener pronósticos del clima usando SSE',
  jsonb_build_object(
    'cache_duration_seconds', 600,
    'timeout_seconds', 10
  ),
  NOW()
);

-- Registro de la herramienta del clima
INSERT INTO mcp_tools (name, server_id, description, function_json, created_at)
SELECT 
  'get_weather_forecast',
  id,
  'Obtiene el pronóstico del clima para una ubicación específica',
  jsonb_build_object(
    'name', 'get_weather_forecast',
    'description', 'Obtiene el pronóstico del clima para una ubicación específica',
    'parameters', jsonb_build_object(
      'type', 'object',
      'properties', jsonb_build_object(
        'location', jsonb_build_object(
          'type', 'string',
          'description', 'La ubicación para la que se desea el pronóstico del clima, puede ser ciudad, estado, país, etc.'
        )
      ),
      'required', array['location']
    )
  ),
  NOW()
FROM mcp_servers
WHERE name = 'Servicio de Clima SSE' AND type = 'sse';
