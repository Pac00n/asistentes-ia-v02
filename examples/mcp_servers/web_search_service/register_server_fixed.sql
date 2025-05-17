-- Registro del servicio de búsqueda web en la tabla de servidores MCP
INSERT INTO mcp_servers (name, url, type, api_key, description, configuration, created_at)
VALUES (
  'Servicio de Búsqueda Web SSE',
  'http://localhost:3458',
  'sse',
  'demo_api_key',
  'Servicio MCP para realizar búsquedas web usando SSE',
  jsonb_build_object(
    'cache_duration_seconds', 3600,
    'timeout_seconds', 15
  ),
  NOW()
);

-- Registro de la herramienta de búsqueda web
INSERT INTO mcp_tools (name, server_id, description, function_json, created_at)
SELECT 
  'web_search',
  id,
  'Busca información en la web utilizando un motor de búsqueda',
  jsonb_build_object(
    'name', 'web_search',
    'description', 'Busca información en la web utilizando un motor de búsqueda',
    'parameters', jsonb_build_object(
      'type', 'object',
      'properties', jsonb_build_object(
        'query', jsonb_build_object(
          'type', 'string',
          'description', 'La consulta de búsqueda que se desea realizar'
        ),
        'num_results', jsonb_build_object(
          'type', 'number',
          'description', 'Número de resultados a devolver (máximo 10)',
          'default', 5
        )
      ),
      'required', array['query']
    )
  ),
  NOW()
FROM mcp_servers
WHERE name = 'Servicio de Búsqueda Web SSE' AND type = 'sse';
