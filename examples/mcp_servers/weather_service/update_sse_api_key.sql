-- Actualizar el servidor SSE para incluir la API key en la configuración
UPDATE mcp_servers
SET params = '{"url": "http://localhost:3456", "api_key": "mcp-weather-service-api-key-2025"}'
WHERE type = 'sse' AND name = 'Servicio de Clima SSE';

-- Verificar que la actualización fue exitosa
SELECT id, name, type, params 
FROM mcp_servers 
WHERE type = 'sse' AND name = 'Servicio de Clima SSE';
