// Declaraciones de tipo para @modelcontextprotocol/sdk

declare module '@modelcontextprotocol/sdk' {
  // Tipos para el cliente
  export interface McpClientOptions {
    clientName: string;
    clientVersion: string;
    capabilities?: any;
    transport?: any;
  }

  export interface McpClientToolDefinition {
    name: string;
    description: string;
    parameters: any;
  }

  export class McpClient {
    constructor(options: McpClientOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    callTool(toolName: string, parameters: any): Promise<any>;
    executeTool(toolName: string, parameters: any): Promise<any>;
    getCapabilities(): Promise<{
      tools?: Array<{
        name: string;
        description: string;
        parametersSchema: any;
      }>;
    }>;
    // Agrega otros métodos según sea necesario
  }

  // Tipos para el servidor
  export class McpServer {
    static create(options: any): Promise<McpServer>;
    start(): Promise<void>;
    stop(): Promise<void>;
    // Agrega otros métodos según sea necesario
  }

  // Tipos para el transporte
  export class StdioClientTransport {
    constructor(options: any);
    // Agrega métodos según sea necesario
  }

  export * from '@modelcontextprotocol/sdk/client';
  export * from '@modelcontextprotocol/sdk/server';
}

// Exportaciones para módulos específicos
declare module '@modelcontextprotocol/sdk/client' {
  export * from '@modelcontextprotocol/sdk/dist/esm/client/index';
}

declare module '@modelcontextprotocol/sdk/server' {
  export * from '@modelcontextprotocol/sdk/dist/esm/server/index';
}

declare module '@modelcontextprotocol/sdk/client/mcp' {
  export * from '@modelcontextprotocol/sdk/dist/esm/client/mcp';
}

declare module '@modelcontextprotocol/sdk/client/stdio' {
  export * from '@modelcontextprotocol/sdk/dist/esm/client/stdio';
}

declare module '@modelcontextprotocol/sdk/server/mcp' {
  export * from '@modelcontextprotocol/sdk/dist/esm/server/mcp';
}
