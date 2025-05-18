// lib/mcp-client.ts

import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { startMCPServer, mcpServers, stopMCPServer } from './mcp-config'; // Added stopMCPServer

// Clase para gestionar el cliente MCP
export class MCPManager {
  private static instance: MCPManager;
  private client: McpClient | null = null;
  private activeServers: Set<string> = new Set();
  private transports: Map<string, StdioClientTransport> = new Map();
  
  private constructor() {
    // Constructor privado para singleton
  }
  
  // Obtener instancia única
  public static getInstance(): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager();
    }
    return MCPManager.instance;
  }
  
  // Inicializar cliente MCP
  public async initialize(): Promise<boolean> {
    try {
      if (!this.client) {
        this.client = new McpClient({
          clientName: "Asistente-IA-v02",
          clientVersion: "1.0.0",
        });
        console.log("[MCP] Cliente inicializado");
      }
      return true;
    } catch (error) {
      console.error("[MCP] Error inicializando cliente:", error);
      return false;
    }
  }
  
  // Conectar a un servidor MCP
  public async connectToServer(serverKey: string): Promise<boolean> {
    if (!this.client) {
      await this.initialize();
    }
    
    if (this.activeServers.has(serverKey)) {
      console.log(`[MCP] Servidor ${serverKey} ya está activo`);
      return true;
    }
    
    try {
      // Iniciar el servidor MCP
      const serverProcess = await startMCPServer(serverKey); // Changed to get the process
      if (!serverProcess) {
        throw new Error(`No se pudo iniciar el servidor ${serverKey}`);
      }
      
      // Crear transporte para la conexión
      const transport = new StdioClientTransport({
        serverProcess: serverProcess, // Use the returned process
      });
      
      // Guardar referencia al transporte
      this.transports.set(serverKey, transport);
      
      // Conectar el cliente al servidor
      await this.client!.connect(transport);
      this.activeServers.add(serverKey);
      
      console.log(`[MCP] Conectado al servidor ${serverKey}`);
      return true;
    } catch (error) {
      console.error(`[MCP] Error conectando al servidor ${serverKey}:`, error);
      return false;
    }
  }
  
  // Obtener herramientas disponibles de un servidor
  public async getServerTools(serverKey: string): Promise<any[]> {
    if (!this.activeServers.has(serverKey)) {
      await this.connectToServer(serverKey);
    }
    
    try {
      if (!this.client) {
        throw new Error("Cliente MCP no inicializado");
      }
      
      // Obtener capacidades del servidor
      const capabilities = await this.client.getCapabilities();
      const tools = capabilities.tools || {};
      
      return Object.keys(tools).map(toolName => ({
        name: toolName,
        description: tools[toolName].description || "",
        parameters: tools[toolName].parameters || {}
      }));
    } catch (error) {
      console.error(`[MCP] Error obteniendo herramientas del servidor ${serverKey}:`, error);
      return [];
    }
  }
  
  // Ejecutar una herramienta en un servidor MCP
  public async executeTool(serverKey: string, toolName: string, params: any): Promise<any> {
    if (!this.activeServers.has(serverKey)) {
      await this.connectToServer(serverKey);
    }
    
    try {
      if (!this.client) {
        throw new Error("Cliente MCP no inicializado");
      }
      
      // Ejecutar herramienta
      const result = await this.client.executeTool(toolName, params);
      return result;
    } catch (error) {
      console.error(`[MCP] Error ejecutando herramienta ${toolName} en servidor ${serverKey}:`, error);
      throw error;
    }
  }
  
  // Desconectar de un servidor MCP
  public async disconnectFromServer(serverKey: string): Promise<boolean> {
    if (!this.activeServers.has(serverKey)) {
      return true; // Ya está desconectado
    }
    
    try {
      // Obtener el transporte
      const transport = this.transports.get(serverKey);
      if (!transport) {
        throw new Error(`Transporte no encontrado para servidor ${serverKey}`);
      }
      
      // Desconectar del servidor
      if (this.client) {
        await this.client.disconnect(transport);
      }
      
      // Detener el servidor
      stopMCPServer(serverKey);
      
      // Limpiar referencias
      this.activeServers.delete(serverKey);
      this.transports.delete(serverKey);
      
      console.log(`[MCP] Desconectado del servidor ${serverKey}`);
      return true;
    } catch (error) {
      console.error(`[MCP] Error desconectando del servidor ${serverKey}:`, error);
      return false;
    }
  }
  
  // Limpiar todas las conexiones
  public async cleanup(): Promise<void> {
    for (const serverKey of this.activeServers) {
      await this.disconnectFromServer(serverKey);
    }
    
    this.client = null;
    console.log("[MCP] Cliente limpiado y conexiones cerradas");
  }
}

// Exportar instancia única
export const mcpManager = MCPManager.getInstance();