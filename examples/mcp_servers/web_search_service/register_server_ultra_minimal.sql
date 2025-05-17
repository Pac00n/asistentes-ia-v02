-- Registro del servicio de búsqueda web en la tabla de servidores MCP
INSERT INTO mcp_servers (name, url, type)
VALUES (
  'Servicio de Búsqueda Web SSE',
  'http://localhost:3458',
  'sse'
);

-- Registro de la herramienta de búsqueda web - usando solo las columnas básicas
INSERT INTO mcp_tools (name, server_id, description)
SELECT 
  'web_search',
  id,
  'Busca información en la web utilizando un motor de búsqueda'
FROM mcp_servers
WHERE name = 'Servicio de Búsqueda Web SSE' AND type = 'sse';
