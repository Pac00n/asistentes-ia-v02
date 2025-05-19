// lib/mcp-client.ts

import { McpClient, McpClientOptions, McpClientToolDefinition } from '@modelcontextprotocol/sdk/client/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
// McpServer is used in mcp-config, not directly here.

import { startMCPServer, stopMCPServer, mcpServers, MCPServerConfig } from './mcp-config';

export class MCPManager {
  private static instance: MCPManager;
  private client: McpClient | null = null;
  private activeServerConfigs: Map<string, MCPServerConfig> = new Map(); 
  private transports: Map<string, StdioClientTransport> = new Map();
  
  private constructor() {
    console.log("[MCPManager] Instantiated");
  }
  
  public static getInstance(): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager();
    }
    return MCPManager.instance;
  }
  
  public async initialize(options?: McpClientOptions): Promise<boolean> {
    if (this.client) {
      console.log("[MCPManager] Client already initialized.");
      return true;
    }
    try {
      const clientOptions: McpClientOptions = options || {
        clientName: "Asistente-IA-v02",
        clientVersion: "1.0.1",
      };
      this.client = new McpClient(clientOptions);
      console.log(`[MCPManager] McpClient initialized (Name: ${clientOptions.clientName}, Version: ${clientOptions.clientVersion})`);
      return true;
    } catch (error) {
      console.error("[MCPManager] Error initializing McpClient:", error);
      this.client = null;
      return false;
    }
  }
  
  public async connectToServer(serverKey: string): Promise<boolean> {
    if (!this.client) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.error("[MCPManager] Cannot connect to server, McpClient failed to initialize.");
        return false;
      }
    }
    
    if (this.transports.has(serverKey) && this.activeServerConfigs.has(serverKey)) {
        const serverConfig = this.activeServerConfigs.get(serverKey);
        if (serverConfig?.process && !serverConfig.process.killed) {
             console.log(`[MCPManager] Server ${serverKey} connection seems active (transport exists and process running).`);
             return true;
        }
    }
    
    const serverConfig = mcpServers[serverKey];
    if (!serverConfig) {
      console.error(`[MCPManager] No configuration found for MCP server key: ${serverKey}`);
      return false;
    }

    try {
      const mcpServerInstanceFromConfig = await startMCPServer(serverKey);
      if (!mcpServerInstanceFromConfig || !serverConfig.process) {
        throw new Error(`Failed to start MCP server process for ${serverKey}, or process not found in config.`);
      }
      
      console.log(`[MCPManager] Creating StdioClientTransport for server ${serverKey} (PID: ${serverConfig.process.pid})`);
      const transport = new StdioClientTransport({
        serverProcess: serverConfig.process,
      });
      
      this.transports.set(serverKey, transport);
      
      console.log(`[MCPManager] Connecting McpClient to server ${serverKey} via StdioClientTransport...`);
      await this.client!.connect(transport);
      
      this.activeServerConfigs.set(serverKey, serverConfig);
      console.log(`[MCPManager] Successfully connected to MCP server: ${serverKey}`);
      return true;
    } catch (error) {
      console.error(`[MCPManager] Error connecting to MCP server ${serverKey}:`, error);
      if (this.transports.has(serverKey)){
          this.transports.delete(serverKey);
      }
      if (serverConfig.process && !serverConfig.process.killed) {
        console.log(`[MCPManager] Attempting to stop server ${serverKey} due to connection error.`);
        stopMCPServer(serverKey);
      }
      return false;
    }
  }
  
  public async getServerTools(serverKey: string): Promise<McpClientToolDefinition[]> {
    if (!this.client) {
      console.error("[MCPManager] McpClient not initialized. Cannot get server tools.");
      return [];
    }
    if (!this.activeServerConfigs.has(serverKey) || !this.transports.has(serverKey)) {
      console.warn(`[MCPManager] Server ${serverKey} is not actively connected. Attempting to connect first.`);
      const connected = await this.connectToServer(serverKey);
      if (!connected) {
        console.error(`[MCPManager] Could not connect to server ${serverKey} to get tools.`);
        return [];
      }
    }
    
    try {
      console.log(`[MCPManager] Fetching capabilities for server ${serverKey} (via global client capabilities)`);
      const capabilities = await this.client.getCapabilities();
      const allTools = capabilities.tools || {};
      
      const toolsArray: McpClientToolDefinition[] = Object.entries(allTools).map(([toolName, toolDef]) => ({
        name: toolName,
        description: toolDef.description || "",
        parametersSchema: toolDef.parametersSchema || { type: 'object' }, 
      }));
      
      console.log(`[MCPManager] Tools for ${serverKey} (potentially all tools from client):`, toolsArray.map(t => t.name));
      return toolsArray;
    } catch (error) {
      console.error(`[MCPManager] Error getting tools for server ${serverKey}:`, error);
      return [];
    }
  }
  
  public async executeTool(serverKeyOrToolName: string, toolNameOrParams: string | any, paramsIfServerKeyFirst?: any): Promise<any> {
    if (!this.client) {
      throw new Error("[MCPManager] McpClient not initialized. Cannot execute tool.");
    }

    let toolNameToExecute: string;
    let paramsToExecute: any;
    let serverKeyForTool: string | undefined = undefined;

    if (paramsIfServerKeyFirst !== undefined) {
        serverKeyForTool = serverKeyOrToolName;
        toolNameToExecute = toolNameOrParams as string;
        paramsToExecute = paramsIfServerKeyFirst;
    } else {
        toolNameToExecute = serverKeyOrToolName;
        paramsToExecute = toolNameOrParams;
        if(toolNameToExecute.includes('.')) {
            const parts = toolNameToExecute.split('.');
            const potentialServerKey = parts[0];
            if (mcpServers[potentialServerKey]) {
                serverKeyForTool = potentialServerKey;
            }
        }
    }

    if (serverKeyForTool && (!this.activeServerConfigs.has(serverKeyForTool) || !this.transports.has(serverKeyForTool))) {
      console.warn(`[MCPManager] Server ${serverKeyForTool} is not actively connected for tool ${toolNameToExecute}. Attempting to connect.`);
      const connected = await this.connectToServer(serverKeyForTool);
      if (!connected) {
        throw new Error(`[MCPManager] Server ${serverKeyForTool} not available to execute tool ${toolNameToExecute}`);
      }
    }
    
    try {
      console.log(`[MCPManager] Executing tool '${toolNameToExecute}' with params:`, paramsToExecute, `(Server hint: ${serverKeyForTool || 'any'})`);
      const result = await this.client.executeTool(toolNameToExecute, paramsToExecute);
      console.log(`[MCPManager] Tool '${toolNameToExecute}' executed successfully.`);
      return result;
    } catch (error) {
      console.error(`[MCPManager] Error executing tool '${toolNameToExecute}':`, error);
      throw error;
    }
  }
  
  public async disconnectFromServer(serverKey: string): Promise<boolean> {
    if (!this.activeServerConfigs.has(serverKey) && !this.transports.has(serverKey)) {
      console.log(`[MCPManager] Server ${serverKey} is not active or no transport found, no need to disconnect.`);
      return true; 
    }
    
    const transport = this.transports.get(serverKey);
    if (!transport) {
      console.warn(`[MCPManager] No transport found for server ${serverKey} during disconnect, though it was marked active.`);
    } else {
        try {
            if (this.client) {
                console.log(`[MCPManager] Disconnecting McpClient from transport for server ${serverKey}...`);
                await this.client.disconnect(transport); 
            }
        } catch (error) {
            console.error(`[MCPManager] Error disconnecting client from transport for ${serverKey}:`, error);
        }
    }

    console.log(`[MCPManager] Stopping server process for ${serverKey}...`);
    stopMCPServer(serverKey); 
    
    this.activeServerConfigs.delete(serverKey);
    this.transports.delete(serverKey);
    console.log(`[MCPManager] Server ${serverKey} fully disconnected and cleaned up.`);
    return true;
  }
  
  public async cleanup(): Promise<void> {
    console.log("[MCPManager] Cleaning up McpClient and all active server connections...");
    const serverKeysToDisconnect = Array.from(this.activeServerConfigs.keys());
    for (const serverKey of serverKeysToDisconnect) {
      await this.disconnectFromServer(serverKey);
    }
    this.activeServerConfigs.clear();
    this.transports.clear();
    
    Object.keys(mcpServers).forEach(serverKey => {
        if (mcpServers[serverKey].process && !mcpServers[serverKey].process?.killed) {
            console.log(`[MCPManager] Cleaning up lingering server process from mcp-config for ${serverKey}`);
            stopMCPServer(serverKey);
        }
    });

    this.client = null;
    console.log("[MCPManager] McpClient instance nullified and all server connections closed.");
  }
}

export const mcpManager = MCPManager.getInstance();
