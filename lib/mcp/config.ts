// lib/mcp/config.ts

export interface McpServerConfig {
  id: string;
  url: string;
  name?: string;
  apiKey?: string;
}

export function getMcpServersConfiguration(): McpServerConfig[] {
  const configJson = process.env.MCP_SERVERS_CONFIG;

  if (!configJson) {
    console.warn("MCP_SERVERS_CONFIG no está definida. El cliente MCP no tendrá servidores externos configurados.");
    return [];
  }

  try {
    const parsedConfig = JSON.parse(configJson);

    if (!Array.isArray(parsedConfig)) {
      console.error("Error: MCP_SERVERS_CONFIG no es un array JSON válido.");
      return [];
    }

    // Validación básica de cada objeto de configuración
    const validConfigs: McpServerConfig[] = [];
    for (const item of parsedConfig) {
      if (item && typeof item.id === 'string' && typeof item.url === 'string') {
        // Asegurarse de que la URL es válida (simple check)
        try {
          new URL(item.url); // Valida el formato de la URL
          validConfigs.push({
            id: item.id,
            url: item.url,
            name: typeof item.name === 'string' ? item.name : undefined,
            apiKey: typeof item.apiKey === 'string' ? item.apiKey : undefined,
          });
        } catch (e) {
          console.error(`Error: URL inválida para el servidor MCP con id '${item.id}': ${item.url}`);
        }
      } else {
        console.warn("Advertencia: Elemento de configuración de servidor MCP inválido u omitido:", item);
      }
    }
    return validConfigs;

  } catch (error) {
    console.error("Error al parsear MCP_SERVERS_CONFIG:", error);
    return [];
  }
}
