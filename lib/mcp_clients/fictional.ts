// lib/mcp_clients/fictional.ts
import { BaseMCPClient } from './base';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente MCP ficticio para simulación de herramientas.
 * Utiliza datos de Supabase para simular herramientas y resultados.
 */
export class FictionalMCPClient extends BaseMCPClient {
  private supabase: SupabaseClient;
  private tools: any[] = [];

  constructor(serverId: string, supabaseClient: SupabaseClient) {
    super(serverId);
    this.supabase = supabaseClient;
  }

  /**
   * Simula una conexión cargando herramientas desde Supabase
   */
  async connect(): Promise<void> {
    try {
      this.connectionStatus = 'connecting';
      console.log(`FictionalMCPClient: Conectando al servidor ficticio ${this.serverId}`);
      
      // Cargar herramientas desde Supabase
      await this.loadTools();
      
      this.connectionStatus = 'connected';
      console.log(`FictionalMCPClient: Conectado al servidor ficticio ${this.serverId}`);
    } catch (error) {
      this.connectionStatus = 'error';
      console.error(`FictionalMCPClient: Error conectando al servidor ficticio ${this.serverId}:`, error);
      throw error;
    }
  }

  /**
   * Simula desconexión
   */
  async disconnect(): Promise<void> {
    this.connectionStatus = 'disconnected';
    console.log(`FictionalMCPClient: Desconectado del servidor ficticio ${this.serverId}`);
  }

  /**
   * Retorna las herramientas cargadas desde Supabase
   */
  async listTools(): Promise<any[]> {
    if (this.connectionStatus !== 'connected') {
      throw new Error(`FictionalMCPClient: No se puede listar herramientas. Estado de conexión: ${this.connectionStatus}`);
    }
    return this.tools;
  }

  /**
   * Simula la ejecución de una herramienta con resultados predefinidos
   */
  async callTool(toolName: string, parameters: any): Promise<any> {
    if (this.connectionStatus !== 'connected') {
      throw new Error(`FictionalMCPClient: No se puede ejecutar herramienta. Estado de conexión: ${this.connectionStatus}`);
    }

    console.log(`FictionalMCPClient: Ejecutando herramienta ${toolName} con parámetros:`, parameters);
    
    // Simular latencia
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulaciones específicas por tipo de herramienta
    switch (toolName) {
      case 'get_weather_forecast':
        return {
          forecast: `Sunny with a chance of awesome for ${parameters.location}! (Simulated)`,
          temperature: "25°C"
        };
      
      // Podemos añadir más simulaciones de herramientas aquí
      
      default:
        return { 
          message: `Resultado simulado para ${toolName}`, 
          parameters_received: parameters 
        };
    }
  }

  /**
   * Carga las herramientas desde Supabase
   */
  private async loadTools(): Promise<void> {
    const { data, error } = await this.supabase
      .from('mcp_tools')
      .select('*')
      .eq('server_id', this.serverId);
      
    if (error) {
      throw new Error(`FictionalMCPClient: Error cargando herramientas: ${error.message}`);
    }
    
    this.tools = data || [];
    console.log(`FictionalMCPClient: Cargadas ${this.tools.length} herramientas para el servidor ${this.serverId}`);
  }
}
