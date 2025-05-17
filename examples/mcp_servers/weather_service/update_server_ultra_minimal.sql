-- Registro del servicio de clima en la tabla de servidores MCP
INSERT INTO mcp_servers (name, url, type)
VALUES (
  'Servicio de Clima SSE',
  'http://localhost:3456',
  'sse'
);

-- Registro de la herramienta del clima - usando solo las columnas básicas
INSERT INTO mcp_tools (name, server_id, description)
SELECT 
  'get_weather_forecast',
  id,
  'Obtiene el pronóstico del clima para una ubicación específica'
FROM mcp_servers
WHERE name = 'Servicio de Clima SSE' AND type = 'sse';
