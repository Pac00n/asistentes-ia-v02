-- Script mejorado para actualizar o insertar el servicio de búsqueda web
-- Primero verifica si el servidor ya existe
DO $$ 
DECLARE
  server_id uuid;
BEGIN
  -- Buscar el servidor existente
  SELECT id INTO server_id 
  FROM mcp_servers 
  WHERE name = 'Servicio de Búsqueda Web SSE';
  
  -- Si no existe, insertar nuevo servidor
  IF server_id IS NULL THEN
    INSERT INTO mcp_servers (name, url, type, description, active, params, created_at)
    VALUES (
      'Servicio de Búsqueda Web SSE',
      'http://localhost:3458',
      'sse',
      'Servicio MCP para realizar búsquedas web usando SSE',
      true,
      jsonb_build_object(
        'cache_duration_seconds', 3600,
        'timeout_seconds', 15
      ),
      NOW()
    )
    RETURNING id INTO server_id;
    
    RAISE NOTICE 'Servidor creado con ID: %', server_id;
  ELSE
    -- Si ya existe, actualizar
    UPDATE mcp_servers 
    SET 
      url = 'http://localhost:3458',
      description = 'Servicio MCP para realizar búsquedas web usando SSE',
      active = true,
      params = jsonb_build_object(
        'cache_duration_seconds', 3600,
        'timeout_seconds', 15
      ),
      updated_at = NOW()
    WHERE id = server_id;
    
    RAISE NOTICE 'Servidor actualizado con ID: %', server_id;
  END IF;
  
  -- Verificar si la herramienta ya existe
  IF EXISTS (SELECT 1 FROM mcp_tools WHERE name = 'web_search' AND server_id = server_id) THEN
    -- Actualizar la herramienta existente
    UPDATE mcp_tools
    SET 
      description = 'Busca información en la web utilizando un motor de búsqueda',
      parameters = jsonb_build_object(
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
      updated_at = NOW()
    WHERE name = 'web_search' AND server_id = server_id;
    
    RAISE NOTICE 'Herramienta web_search actualizada';
  ELSE
    -- Insertar la nueva herramienta
    INSERT INTO mcp_tools (name, server_id, description, parameters, created_at)
    VALUES (
      'web_search',
      server_id,
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
    );
    
    RAISE NOTICE 'Herramienta web_search creada';
  END IF;
END $$;
