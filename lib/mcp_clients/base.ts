// lib/mcp_clients/base.ts
/**
 * Interfaz base para todos los clientes MCP
 */
export interface IMCPClient {
  // Identificador del servidor con el que este cliente se conecta
  serverId: string;
  
  // Estado de la conexión
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Método para conectarse al servidor
  connect(): Promise<void>;
  
  // Método para desconectarse del servidor
  disconnect(): Promise<void>;
  
  // Método para listar las herramientas disponibles en el servidor
  listTools(): Promise<any[]>;
  
  // Método para ejecutar una herramienta
  callTool(toolName: string, parameters: any): Promise<any>;
}

/**
 * Clase base para todos los clientes MCP
 */
export abstract class BaseMCPClient implements IMCPClient {
  serverId: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  constructor(serverId: string) {
    this.serverId = serverId;
    this.connectionStatus = 'disconnected';
  }
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract listTools(): Promise<any[]>;
  abstract callTool(toolName: string, parameters: any): Promise<any>;
}
