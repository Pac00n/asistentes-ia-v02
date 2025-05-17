// lib/mcp_adapter.ts
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { IMCPClient } from './mcp_clients/base';
import { MCPClientFactory } from './mcp_clients/factory';

// Tipos para los datos de Supabase (simplificados por ahora)
interface McpServer {
  id: string;
  name: string;
  type: 'stdio' | 'sse' | 'fictional';
  url?: string | null;
  params?: any | null;
  active?: boolean | null;
}

interface McpTool {
  id: string;
  server_id: string;
  name: string;
  description?: string | null;
  parameters: any; // Debería ser un JSON Schema
}

interface McpAssistantTool {
  assistant_id: string;
  tool_id: string;
  enabled: boolean;
}

// Formato de herramienta para OpenAI
interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: any; // JSON Schema
  };
}

export class MCPAdapter {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private clientFactory: MCPClientFactory;
  private mcpClients: Map<string, IMCPClient>; // Clientes MCP por serverId
  private toolsCache: Map<string, { mcpTools: McpTool[], openAITools: OpenAITool[] }>;

  constructor(supabaseClient: SupabaseClient, openaiClient: OpenAI) {
    this.supabase = supabaseClient;
    this.openai = openaiClient;
    this.clientFactory = new MCPClientFactory(supabaseClient);
    this.mcpClients = new Map();
    this.toolsCache = new Map();
    console.log("MCPAdapter instantiated");
  }

  /**
   * Inicializa el adaptador cargando la configuración de servidores MCP desde Supabase.
   */
  async initialize(): Promise<void> {
    console.log("MCPAdapter: Initializing...");
    const { data: servers, error } = await this.supabase
      .from('mcp_servers')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error("MCPAdapter: Error loading MCP servers:", error);
      throw new Error(`Error loading MCP servers: ${error.message}`);
    }

    if (!servers || servers.length === 0) {
      console.warn("MCPAdapter: No active MCP servers found in Supabase.");
      return;
    }

    console.log(`MCPAdapter: Found ${servers.length} active MCP servers.`);

    for (const server of servers as McpServer[]) {
      await this.connectToServer(server);
    }
    console.log("MCPAdapter: Initialization complete.");
  }

  /**
   * Conecta a un servidor MCP y carga sus herramientas.
   * Utiliza la fábrica de clientes para crear el cliente apropiado según el tipo de servidor.
   */
  private async connectToServer(serverConfig: McpServer): Promise<void> {
    console.log(`MCPAdapter: Connecting to server ${serverConfig.name} (ID: ${serverConfig.id}, Type: ${serverConfig.type})`);
    try {
      // Crear cliente MCP a través de la fábrica
      const client = await this.clientFactory.createClient(serverConfig);
      
      // Conectar al servidor
      await client.connect();
      
      // Almacenar el cliente en caché
      this.mcpClients.set(serverConfig.id, client);
      
      // Cargar herramientas del servidor
      await this.cacheServerTools(serverConfig.id);
      
      console.log(`MCPAdapter: Successfully connected to ${serverConfig.type} server ${serverConfig.name} and cached its tools.`);
    } catch (error) {
      console.error(`MCPAdapter: Error connecting to server ${serverConfig.name}:`, error);
      throw new Error(`Failed to connect to server ${serverConfig.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Carga las herramientas de un servidor MCP específico,
   * las traduce al formato de OpenAI y las almacena en caché.
   * Para servidores reales, obtiene las herramientas del cliente MCP.
   * Para servidores ficticios, carga las herramientas desde Supabase.
   */
  private async cacheServerTools(serverId: string): Promise<void> {
    console.log(`MCPAdapter: Caching tools for server ID: ${serverId}`);
    
    // Obtener el cliente para este servidor
    const client = this.mcpClients.get(serverId);
    if (!client) {
      throw new Error(`MCPAdapter: No client found for server ${serverId}`);
    }
    
    try {
      // Obtener herramientas usando el cliente MCP
      const toolsList = await client.listTools();
      
      if (!toolsList || toolsList.length === 0) {
        console.warn(`MCPAdapter: No tools found for server ${serverId}`);
        this.toolsCache.set(serverId, { mcpTools: [], openAITools: [] });
        return;
      }
      
      // Convertir las herramientas al formato McpTool si es necesario
      const mcpTools: McpTool[] = toolsList.map(tool => ({
        id: tool.id || `${serverId}_${tool.name}`,
        server_id: serverId,
        name: tool.name,
        description: tool.description || null,
        parameters: tool.parameters || {}
      }));
      
      // Traducir al formato de OpenAI
      const openAITools = mcpTools.map(tool => 
        this.translateToolToOpenAIFormat(tool, serverId)
      );

      // Almacenar en caché
      this.toolsCache.set(serverId, { mcpTools, openAITools });
      console.log(`MCPAdapter: Cached ${mcpTools.length} tools for server ${serverId}.`);
    } catch (error) {
      console.error(`MCPAdapter: Error loading tools for server ${serverId}:`, error);
      // Limpiar caché si hay error
      this.toolsCache.delete(serverId);
      throw new Error(`Failed to cache tools for server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Traduce una herramienta MCP al formato de función de OpenAI.
   */
  private translateToolToOpenAIFormat(mcpTool: McpTool, serverId: string): OpenAITool {
    // Usar un prefijo para identificar claramente las herramientas MCP y evitar colisiones.
    // El formato será: mcp_${serverId}_${mcpTool.name}
    // OpenAI tiene restricciones en los nombres de funciones (letras, números, guiones bajos, max 64 chars)
    const openAIName = `mcp_${serverId.replace(/-/g, '_')}_${mcpTool.name}`.substring(0, 64);

    return {
      type: 'function',
      function: {
        name: openAIName,
        description: mcpTool.description || undefined,
        parameters: mcpTool.parameters || { type: 'object', properties: {} },
      },
    };
  }

  /**
   * Obtiene todas las herramientas disponibles (en formato OpenAI) para un asistente específico.
   * TODO: Implementar la lógica para filtrar herramientas basadas en `mcp_assistant_tools`.
   */
  async getToolsForAssistant(assistantId: string): Promise<OpenAITool[]> {
    console.log(`MCPAdapter: Getting tools for assistant ID: ${assistantId}`);
    let allOpenAITools: OpenAITool[] = [];

    // Por ahora, devolvemos todas las herramientas cacheadas de todos los servidores.
    // En el futuro, filtraremos según la tabla `mcp_assistant_tools`.
    
    // Ejemplo de cómo se podría filtrar (requiere cargar `mcp_assistant_tools`):
    // const { data: assistantToolLinks, error } = await this.supabase
    //   .from('mcp_assistant_tools')
    //   .select('tool_id, mcp_tools(server_id, name, description, parameters)')
    //   .eq('assistant_id', assistantId)
    //   .eq('enabled', true);
    // if (error || !assistantToolLinks) {
    //   console.error('MCPAdapter: Error fetching assistant tool links', error);
    //   return [];
    // }
    // allOpenAITools = assistantToolLinks.map(link => {
    //   const tool = (link.mcp_tools as any) as McpTool; // Cast needed due to Supabase join type
    //   return this.translateToolToOpenAIFormat(tool, tool.server_id);
    // });


    for (const serverCache of this.toolsCache.values()) {
      allOpenAITools = allOpenAITools.concat(serverCache.openAITools);
    }

    console.log(`MCPAdapter: Providing ${allOpenAITools.length} tools for assistant ${assistantId}.`);
    return allOpenAITools;
  }

  /**
   * Ejecuta una llamada a herramienta MCP.
   * Para esta fase, simulará la ejecución y devolverá una respuesta ficticia.
   */
  async executeToolCall(
    toolCallId: string, // ID de la tool_call de OpenAI
    functionName: string, // Nombre de la función como la conoce OpenAI (e.g., mcp_serverid_toolname)
    functionArgs: any,
    assistantId: string,
    threadId: string,
    userIdentifier?: string,
  ): Promise<any> {
    console.log(`MCPAdapter: Attempting to execute tool call for OpenAI function: ${functionName}`);
    
    console.log(`MCPAdapter: Parsing OpenAI function name: ${functionName}`);
    // Parsear serverId y toolName desde functionName
    // Formato esperado: `mcp_${serverId-con-guiones-convertidos-a-guiones-bajos}_${toolName}`
    if (!functionName.startsWith('mcp_')) {
        console.error(`MCPAdapter: Function name does not start with 'mcp_' prefix: ${functionName}`);
        return { error: `Invalid MCP function name format: ${functionName}` };
    }

    // Quitar el prefijo 'mcp_'
    const functionNameWithoutPrefix = functionName.substring(4);
    console.log(`MCPAdapter: Function name without prefix: ${functionNameWithoutPrefix}`);
    
    // Buscar todas las herramientas en la caché
    let toolFound = false;
    let actualServerId = '';
    let toolName = '';
    
    // Recorrer todos los servidores en la caché
    for (const [serverId, cache] of this.toolsCache.entries()) {
        const serverIdWithUnderscores = serverId.replace(/-/g, '_');
        console.log(`MCPAdapter: Checking server ID: ${serverId} (with underscores: ${serverIdWithUnderscores})`);
        
        // Buscar en las herramientas de este servidor
        for (const tool of cache.mcpTools) {
            const expectedFunctionName = `${serverIdWithUnderscores}_${tool.name}`;
            console.log(`MCPAdapter: Checking if '${expectedFunctionName}' matches end of '${functionNameWithoutPrefix}'`);
            
            // Verificar si el nombre coincide con el final del functionNameWithoutPrefix
            if (functionNameWithoutPrefix.endsWith(expectedFunctionName)) {
                actualServerId = serverId;
                toolName = tool.name;
                toolFound = true;
                console.log(`MCPAdapter: Found match! Server ID: ${actualServerId}, Tool Name: ${toolName}`);
                break;
            }
        }
        
        if (toolFound) break;
    }
    
    if (!toolFound) {
        console.error(`MCPAdapter: Could not find matching tool for function name: ${functionName}`);
        return { error: `No matching tool found for function: ${functionName}` };
    }
    
    const serverCache = this.toolsCache.get(actualServerId);

    if (!serverCache || !serverCache.mcpTools.find(t => t.name === toolName)) {
      console.error(`MCPAdapter: Tool ${toolName} on server ${actualServerId} not found in cache for OpenAI function ${functionName}.`);
      return { error: `Tool ${toolName} on server ${actualServerId} not found.` };
    }
    
    console.log(`MCPAdapter: Identified MCP Tool: ${toolName} on Server ID: ${actualServerId}`);

    // 1. Verificar consentimiento (simulado por ahora)
    const consent = await this.verifyUserConsent(actualServerId, toolName, assistantId, userIdentifier);
    if (!consent) {
      const errorMsg = `User consent not granted for tool ${toolName} on server ${actualServerId}.`;
      console.warn(`MCPAdapter: ${errorMsg}`);
      await this.logToolExecution(toolCallId, actualServerId, toolName, assistantId, threadId, functionArgs, 'error', null, errorMsg, userIdentifier);
      return { error: errorMsg };
    }
    console.log(`MCPAdapter: Consent verified for tool ${toolName}.`);

    // 2. Loggear inicio de ejecución
    const executionLogId = await this.logToolExecution(toolCallId, actualServerId, toolName, assistantId, threadId, functionArgs, 'pending', null, undefined, userIdentifier);
    console.log(`MCPAdapter: Logged pending execution for tool ${toolName} with ID: ${executionLogId}`);

    // 3. Simular ejecución de la herramienta
    let result: any;
    let status: 'success' | 'error' = 'success';
    let errorMessage: string | undefined = undefined;

    try {
      // Obtener el cliente MCP para este servidor
      const client = this.mcpClients.get(actualServerId);
      if (!client) {
        throw new Error(`No client found for server ${actualServerId}`);
      }
      
      // Verificar estado de conexión
      if (client.connectionStatus !== 'connected') {
        throw new Error(`Client for server ${actualServerId} is not connected (status: ${client.connectionStatus})`);
      }
      
      console.log(`MCPAdapter: Executing tool ${toolName} with args:`, functionArgs);
      
      // Ejecutar la herramienta a través del cliente MCP
      result = await client.callTool(toolName, functionArgs);
      
      console.log(`MCPAdapter: Tool execution successful for ${toolName}. Result:`, result);

    } catch (e: any) {
      console.error(`MCPAdapter: Error simulating execution of tool ${toolName}:`, e);
      status = 'error';
      // Asegurar que errorMessage sea siempre de tipo string | undefined
      errorMessage = e && typeof e.message === 'string' ? e.message : "Unknown error during tool simulation.";
      result = { error: errorMessage };
    }

    // 4. Loggear finalización de ejecución
    await this.logToolExecution(toolCallId, actualServerId, toolName, assistantId, threadId, functionArgs, status, result, errorMessage, userIdentifier, executionLogId);
    console.log(`MCPAdapter: Logged ${status} execution for tool ${toolName}.`);
    
    return result;
  }
  /**
   * Verifica si el usuario ha dado consentimiento para utilizar una herramienta específica.
   * El consentimiento se verifica consultando la tabla mcp_user_consents.
   * Si estamos en modo desarrollo, se otorga consentimiento automáticamente.
   */
  private async verifyUserConsent(
    serverId: string, 
    toolName: string, 
    assistantId: string, 
    userIdentifier?: string
  ): Promise<boolean> {
    // Verificar modo desarrollo (para pruebas)
    const devMode = process.env.NEXT_PUBLIC_MCP_DEV_MODE === 'true';
    if (devMode) {
      console.log(`MCPAdapter: DESARROLLO - Otorgando consentimiento automático para tool ${toolName} (servidor ${serverId})`);
      return true;
    }
    
    // Si no hay identificador de usuario, no podemos verificar consentimiento
    if (!userIdentifier) {
      console.warn(`MCPAdapter: No userIdentifier provided for consent check. Defaulting to no consent.`);
      return false;
    }
    
    try {
      // 1. Primero necesitamos obtener el tool_id a partir del serverId y toolName
      const { data: toolData, error: toolError } = await this.supabase
        .from('mcp_tools')
        .select('id')
        .eq('server_id', serverId)
        .eq('name', toolName)
        .single();
      
      if (toolError || !toolData) {
        console.warn(`MCPAdapter: No se encontró la herramienta ${toolName} en el servidor ${serverId}. Error: ${toolError?.message}`);
        return false;
      }
      
      const toolId = toolData.id;
      console.log(`MCPAdapter: Verificando consentimiento - Usuario: ${userIdentifier}, Tool ID: ${toolId}`);
      
      // 2. Ahora verificamos el consentimiento usando el tool_id y user_id
      const { data: consentData, error: consentError } = await this.supabase
        .from('mcp_user_consents')
        .select('granted')
        .eq('user_id', userIdentifier)
        .eq('tool_id', toolId)
        .single();
      
      if (consentError) {
        console.warn(`MCPAdapter: Error verificando consentimiento: ${consentError.message}. Por seguridad, se deniega el acceso.`);
        return false;
      }
      
      // Si no hay registro de consentimiento, asumimos que no está otorgado
      if (!consentData) {
        console.log(`MCPAdapter: No hay registro de consentimiento para tool ${toolName}. Se deniega acceso.`);
        return false;
      }
      
      console.log(`MCPAdapter: Resultado de verificación de consentimiento: ${consentData.granted ? 'Otorgado' : 'Denegado'}`);
      return consentData.granted;
    } catch (error) {
      console.error(`MCPAdapter: Excepción verificando consentimiento: ${error}. Denegando acceso por seguridad.`);
      return false;
    }
  }

  /**
   * Registra la ejecución de una herramienta en la tabla `mcp_tool_executions`.
   * Si se proporciona `existingLogId`, actualiza el registro existente.
   */
  private async logToolExecution(
    toolCallId: string,
    serverId: string,
    toolName: string,
    assistantId: string,
    threadId: string,
    args: any,
    status: 'pending' | 'success' | 'error' | 'requires_action_response',
    result?: any | null,
    errorMessage?: string | undefined,
    userIdentifier?: string,
    existingLogId?: string,
  ): Promise<string | null> {
    console.log(`MCPAdapter: Logging tool execution - Server: ${serverId}, Tool: ${toolName}, Status: ${status}`);
    
    const logEntry = {
      tool_call_id: toolCallId,
      server_id: serverId,
      tool_name: toolName,
      assistant_id: assistantId,
      thread_id: threadId,
      arguments: args,
      status: status,
      result: result,
      error_message: errorMessage,
      user_identifier: userIdentifier,
      completed_at: (status === 'success' || status === 'error') ? new Date().toISOString() : undefined,
      // started_at se define por defecto en la DB con NOW() al insertar
    };

    if (existingLogId) {
      // Actualizar registro existente (principalmente para status y completed_at)
      const { data, error } = await this.supabase
        .from('mcp_tool_executions')
        .update({
          status: status,
          result: result,
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existingLogId)
        .select('id')
        .single();
        
      if (error) {
        console.error('MCPAdapter: Error updating tool execution log:', error);
        return null;
      }
      return data?.id || null;
    } else {
      // Crear nuevo registro
      const { data, error } = await this.supabase
        .from('mcp_tool_executions')
        .insert(logEntry)
        .select('id')
        .single();

      if (error) {
        console.error('MCPAdapter: Error inserting tool execution log:', error);
        return null;
      }
      return data?.id || null;
    }
  }

  // TODO: Métodos para gestionar el ciclo de vida (refreshConnections, shutdown) si es necesario.
}
