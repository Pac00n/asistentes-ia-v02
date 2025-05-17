-- Script para corregir los parámetros del servidor de clima SSE
-- El problema es que falta params.url en la configuración

-- Primero verificamos el ID actual del servidor
SELECT id, name, url, params 
FROM mcp_servers 
WHERE id = 'ea7d5f40-4e89-49ad-9951-ba79b59ac798';

-- Actualizamos los parámetros para incluir la URL correcta
UPDATE mcp_servers 
SET params = jsonb_build_object(
    'url', 'http://localhost:3456',  -- URL del servidor SSE de clima
    'cache_duration_seconds', 600,   -- Valores adicionales que existían antes
    'timeout_seconds', 10
)
WHERE id = 'ea7d5f40-4e89-49ad-9951-ba79b59ac798';

-- Verificamos que la actualización fue exitosa
SELECT id, name, url, params 
FROM mcp_servers 
WHERE id = 'ea7d5f40-4e89-49ad-9951-ba79b59ac798';
