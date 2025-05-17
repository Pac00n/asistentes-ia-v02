-- Registro del servicio de búsqueda web en la tabla de servidores MCP
INSERT INTO mcp_servers (name, url, type)
VALUES (
  'Servicio de Búsqueda Web SSE',
  'http://localhost:3458',
  'sse'
);

-- Registro de la herramienta de búsqueda web
INSERT INTO mcp_tools (name, server_id, description, function_json)
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
  )
FROM mcp_servers
WHERE name = 'Servicio de Búsqueda Web SSE' AND type = 'sse';
