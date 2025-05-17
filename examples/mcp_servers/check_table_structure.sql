-- Consulta para verificar la estructura de la tabla mcp_servers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mcp_servers';
