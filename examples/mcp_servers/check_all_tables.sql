-- Consulta para verificar la estructura de la tabla mcp_servers
SELECT 'mcp_servers' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mcp_servers'

UNION ALL

-- Consulta para verificar la estructura de la tabla mcp_tools
SELECT 'mcp_tools' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mcp_tools'

ORDER BY table_name, column_name;
