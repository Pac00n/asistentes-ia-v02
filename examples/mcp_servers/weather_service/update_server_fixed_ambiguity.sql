-- Script mejorado para actualizar o insertar el servicio de clima
-- Primero verifica si el servidor ya existe
DO $$ 
DECLARE
  v_server_id uuid;
BEGIN
  -- Buscar el servidor existente
  SELECT id INTO v_server_id 
  FROM mcp_servers 
  WHERE name = 'Servicio de Clima SSE';
  
  -- Si no existe, insertar nuevo servidor
  IF v_server_id IS NULL THEN
    INSERT INTO mcp_servers (name, url, type, description, active, params, created_at)
    VALUES (
      'Servicio de Clima SSE',
      'http://localhost:3456',
      'sse',
      'Servicio MCP para obtener pronósticos del clima usando SSE',
      true,
      jsonb_build_object(
        'cache_duration_seconds', 600,
        'timeout_seconds', 10
      ),
      NOW()
    )
    RETURNING id INTO v_server_id;
    
    RAISE NOTICE 'Servidor de clima creado con ID: %', v_server_id;
  ELSE
    -- Si ya existe, actualizar
    UPDATE mcp_servers 
    SET 
      url = 'http://localhost:3456',
      description = 'Servicio MCP para obtener pronósticos del clima usando SSE',
      active = true,
      params = jsonb_build_object(
        'cache_duration_seconds', 600,
        'timeout_seconds', 10
      ),
      updated_at = NOW()
    WHERE id = v_server_id;
    
    RAISE NOTICE 'Servidor de clima actualizado con ID: %', v_server_id;
  END IF;
  
  -- Verificar si la herramienta ya existe
  IF EXISTS (SELECT 1 FROM mcp_tools WHERE name = 'get_weather_forecast' AND server_id = v_server_id) THEN
    -- Actualizar la herramienta existente
    UPDATE mcp_tools
    SET 
      description = 'Obtiene el pronóstico del clima para una ubicación específica',
      parameters = jsonb_build_object(
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
      updated_at = NOW()
    WHERE name = 'get_weather_forecast' AND server_id = v_server_id;
    
    RAISE NOTICE 'Herramienta get_weather_forecast actualizada';
  ELSE
    -- Insertar la nueva herramienta
    INSERT INTO mcp_tools (name, server_id, description, parameters, created_at)
    VALUES (
      'get_weather_forecast',
      v_server_id,
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
    );
    
    RAISE NOTICE 'Herramienta get_weather_forecast creada';
  END IF;
END $$;
