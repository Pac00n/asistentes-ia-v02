-- Script para corregir los parámetros del servidor de búsqueda web
-- El problema es que falta params.url en la configuración

-- Primero verificamos el ID actual del servidor
SELECT id, name, url, params 
FROM mcp_servers 
WHERE name = 'Servicio de Búsqueda Web SSE';

-- Actualizamos los parámetros para incluir la URL correcta
UPDATE mcp_servers 
SET params = jsonb_build_object(
    'url', 'http://localhost:3458',  -- URL del servidor SSE
    'cache_duration_seconds', 3600,  -- Valores adicionales que existían antes
    'timeout_seconds', 15
)
WHERE name = 'Servicio de Búsqueda Web SSE';

-- Verificamos que la actualización fue exitosa
SELECT id, name, url, params 
FROM mcp_servers 
WHERE name = 'Servicio de Búsqueda Web SSE';
