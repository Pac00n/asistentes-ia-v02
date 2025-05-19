// lib/mcp-client.ts

import { McpClient, McpClientOptions, McpClientToolDefinition, StdioClientTransport } from '@modelcontextprotocol/sdk/client/mcp.js';
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
      // Note: This gets ALL tools from the client. If you need server-specific tools filtering,
      // and the SDK doesn't provide that directly via getCapabilities(serverKey),
      // you might need to adjust logic here or in how tools are registered/discovered.
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

    // Determine if the first argument is a serverKey or the toolName itself
    if (paramsIfServerKeyFirst !== undefined) { // serverKey, toolName, params
        serverKeyForTool = serverKeyOrToolName;
        toolNameToExecute = toolNameOrParams as string;
        paramsToExecute = paramsIfServerKeyFirst;
    } else { // toolName (possibly with server prefix), params
        toolNameToExecute = serverKeyOrToolName;
        paramsToExecute = toolNameOrParams;
        // Attempt to infer serverKey if toolName is like "serverKey.actualToolName"
        if(toolNameToExecute.includes('.')) {
            const parts = toolNameToExecute.split('.');
            const potentialServerKey = parts[0];
            // Check if this potentialServerKey is a configured server
            if (mcpServers[potentialServerKey]) {
                serverKeyForTool = potentialServerKey;
                // toolNameToExecute = parts.slice(1).join('.'); // Keep full name for client.executeTool
            }
        }
    }

    // If a serverKey is identified (either passed or inferred) and not connected, try to connect
    if (serverKeyForTool && (!this.activeServerConfigs.has(serverKeyForTool) || !this.transports.has(serverKeyForTool))) {
      console.warn(`[MCPManager] Server ${serverKeyForTool} is not actively connected for tool ${toolNameToExecute}. Attempting to connect.`);
      const connected = await this.connectToServer(serverKeyForTool);
      if (!connected) {
        throw new Error(`[MCPManager] Server ${serverKeyForTool} not available to execute tool ${toolNameToExecute}`);
      }
    }
    
    try {
      // The McpClient's executeTool method might handle server-specific routing if tool names are unique
      // or if the serverKey was used to establish a specific connection context previously.
      // If tools can have the same name across different servers, the client or the server needs a way to disambiguate.
      // The current McpClient might send to the "active" or "last connected" transport if not specified.
      // For simplicity, we assume toolNameToExecute is globally unique or prefixed like "serverKey.tool"
      // if it needs to target a specific server when multiple are connected to the same client instance.
      // The MCP SDK's `client.executeTool(toolName, params)` doesn't explicitly take a serverKey.
      // It relies on the toolName being unique or the client being connected to the correct server context.
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
      // Proceed to stop the server process anyway if configured
    } else {
        try {
            if (this.client && this.client.getTransportStatus(transport) !== 'disconnected') {
                console.log(`[MCPManager] Disconnecting McpClient from transport for server ${serverKey}...`);
                await this.client.disconnect(transport); 
            } else if (this.client && this.client.getTransportStatus(transport) === 'disconnected') {
                console.log(`[MCPManager] Transport for server ${serverKey} already disconnected.`);
            }
        } catch (error) {
            // Log error but continue to ensure server process stop is attempted
            console.error(`[MCPManager] Error disconnecting client from transport for ${serverKey}:`, error);
        }
    }

    console.log(`[MCPManager] Stopping server process for ${serverKey}...`);
    // stopMCPServer should handle if the process exists and needs stopping.
    // It's updated in mcp-config.ts to be more robust.
    stopMCPServer(serverKey); 
    
    this.activeServerConfigs.delete(serverKey);
    this.transports.delete(serverKey);
    console.log(`[MCPManager] Server ${serverKey} fully disconnected and cleaned up from MCPManager.`);
    return true;
  }
  
  public async cleanup(): Promise<void> {
    console.log("[MCPManager] Cleaning up McpClient and all active server connections...");
    const serverKeysToDisconnect = Array.from(this.activeServerConfigs.keys());
    for (const serverKey of serverKeysToDisconnect) {
      await this.disconnectFromServer(serverKey); // disconnectFromServer now also calls stopMCPServer
    }
    // Ensure maps are cleared even if disconnectFromServer had issues
    this.activeServerConfigs.clear();
    this.transports.clear();
    
    // Additional check for any servers in mcpServers that might have running processes
    // not tracked in activeServerConfigs (e.g., due to partial initialization failure)
    Object.keys(mcpServers).forEach(serverKey => {
        if (mcpServers[serverKey].process && !mcpServers[serverKey].process?.killed) {
            console.log(`[MCPManager] Cleaning up potentially lingering server process from mcp-config for ${serverKey}`);
            stopMCPServer(serverKey); // stopMCPServer should be idempotent
        }
    });

    if (this.client) {
        // McpClient itself might not have a generic "close" or "destroy" method.
        // Disconnecting all transports is the primary cleanup for it.
        this.client = null; 
        console.log("[MCPManager] McpClient instance nullified.");
    }
    console.log("[MCPManager] MCPManager cleanup complete.");
  }
}

export const mcpManager = MCPManager.getInstance();
