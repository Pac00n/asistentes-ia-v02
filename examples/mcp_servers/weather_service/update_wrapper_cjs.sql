-- Actualizar el servidor MCP existente para que use el script wrapper.cjs
UPDATE mcp_servers
SET params = '{"command": "node", "args": ["c:/Users/jfran/Downloads/ChatbotWEB_v04/asistentes-ia-v02/examples/mcp_servers/weather_service/wrapper.cjs"]}'
WHERE id = '7945026a-b694-408d-be1c-9c193f13ae7a';

-- Verificar que la actualización fue exitosa
SELECT id, name, type, params 
FROM mcp_servers 
WHERE id = '7945026a-b694-408d-be1c-9c193f13ae7a';
