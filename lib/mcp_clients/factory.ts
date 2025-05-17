// lib/mcp_clients/factory.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { IMCPClient } from './base';
import { FictionalMCPClient } from './fictional';
import { StdioMCPClient } from './stdio';
import { SSEMCPClient } from './sse';

/**
 * Factory para crear clientes MCP según el tipo de servidor
 */
export class MCPClientFactory {
  private supabase: SupabaseClient;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }
  
  /**
   * Crea un cliente MCP basado en la información del servidor
   */
  async createClient(serverInfo: any): Promise<IMCPClient> {
    if (!serverInfo || !serverInfo.id || !serverInfo.type) {
      throw new Error('Información de servidor inválida para crear cliente MCP');
    }
    
    console.log(`MCPClientFactory: Creando cliente para servidor ${serverInfo.name} (ID: ${serverInfo.id}, Tipo: ${serverInfo.type})`);
    
    switch (serverInfo.type) {
      case 'fictional':
        return new FictionalMCPClient(serverInfo.id, this.supabase);
        
      case 'stdio':
        if (!serverInfo.params || !serverInfo.params.command) {
          throw new Error(`MCPClientFactory: Falta información de conexión (params.command) para servidor stdio ${serverInfo.id}`);
        }
        return new StdioMCPClient(
          serverInfo.id,
          serverInfo.params.command,
          serverInfo.params.args || []
        );
        
      case 'sse':
        if (!serverInfo.params || !serverInfo.params.url) {
          throw new Error(`MCPClientFactory: Falta información de conexión (params.url) para servidor SSE ${serverInfo.id}`);
        }
        return new SSEMCPClient(
          serverInfo.id,
          serverInfo.params.url,
          serverInfo.params.api_key
        );
        
      default:
        throw new Error(`MCPClientFactory: Tipo de servidor no soportado: ${serverInfo.type}`);
    }
  }
}
