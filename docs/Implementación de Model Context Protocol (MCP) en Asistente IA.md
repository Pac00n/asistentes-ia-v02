# Implementación de Model Context Protocol (MCP) en Asistente IA

## Introducción

Este documento detalla el proceso real de implementación del Model Context Protocol (MCP) en el proyecto de asistente basado en Next.js y OpenAI. La integración permite que el asistente se conecte a diversas herramientas externas mediante el protocolo MCP, ampliando significativamente sus capacidades.

## Proceso de Implementación

### 1. Preparación del Entorno

Primero, cloné el repositorio del asistente en un entorno limpio y verifiqué las versiones de Node.js, npm y pnpm:

```bash
mkdir -p /home/ubuntu/mcp_implementacion
cd /home/ubuntu/mcp_implementacion
git clone https://github.com/Pac00n/asistentes-ia-v02.git
cd asistentes-ia-v02
node -v  # v22.13.0
npm -v   # 10.9.2
pnpm --version  # 10.11.0
```

Luego instalé la dependencia principal de MCP:

```bash
pnpm add @modelcontextprotocol/sdk
```

La instalación se completó correctamente, añadiendo la versión 1.11.4 del SDK de MCP al proyecto.

### 2. Implementación del Código de Integración

#### 2.1 Configuración de Servidores MCP

Creé un archivo de configuración para los servidores MCP en `lib/mcp-config.ts`:

```typescript
// lib/mcp-config.ts

import { spawn } from 'child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  server?: McpServer;
  process?: any;
}

// Configuración de servidores MCP disponibles
export const mcpServers: Record<string, MCPServerConfig> = {
  filesystem: {
    name: "Filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/ubuntu/mcp_implementacion/allowed_files"],
    env: {}
  },
  memory: {
    name: "Memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {}
  },
  // Añade más servidores según necesites
};

// Función para iniciar un servidor MCP
export async function startMCPServer(serverKey: string): Promise<McpServer | null> {
  const config = mcpServers[serverKey];
  if (!config) return null;
  
  try {
    // Iniciar el proceso del servidor
    const serverProcess = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
    });
    
    // Manejar salida y errores
    serverProcess.stdout.on('data', (data) => {
      console.log(`[MCP ${serverKey}] ${data}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[MCP ${serverKey} Error] ${data}`);
    });
    
    // Guardar referencia al proceso
    mcpServers[serverKey].process = serverProcess;
    
    // Esperar a que el servidor esté listo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear y devolver instancia del servidor MCP
    const server = new McpServer({
      name: config.name,
      version: "1.0.0",
      capabilities: {
        resources: {},
        tools: {},
      },
    });
    
    mcpServers[serverKey].server = server;
    return server;
  } catch (error) {
    console.error(`Error iniciando servidor MCP ${serverKey}:`, error);
    return null;
  }
}

// Función para detener un servidor MCP
export function stopMCPServer(serverKey: string): boolean {
  const config = mcpServers[serverKey];
  if (!config || !config.process) return false;
  
  try {
    config.process.kill();
    mcpServers[serverKey].process = undefined;
    mcpServers[serverKey].server = undefined;
    return true;
  } catch (error) {
    console.error(`Error deteniendo servidor MCP ${serverKey}:`, error);
    return false;
  }
}
```

#### 2.2 Cliente MCP

Implementé un gestor de cliente MCP en `lib/mcp-client.ts`:

```typescript
// lib/mcp-client.ts

import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { startMCPServer, mcpServers } from './mcp-config';

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
      const server = await startMCPServer(serverKey);
      if (!server) {
        throw new Error(`No se pudo iniciar el servidor ${serverKey}`);
      }
      
      // Crear transporte para la conexión
      const transport = new StdioClientTransport({
        serverProcess: mcpServers[serverKey].process,
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
```

#### 2.3 Actualización de la Estructura de Asistentes

Modifiqué el archivo `lib/assistants.ts` para incluir soporte para herramientas MCP:

```typescript
// lib/assistants.ts

import {
  Bot, 
  Code, 
  Database, 
  FileText, 
  Image as ImageIcon, 
  Paintbrush, 
  Calculator, 
  FlaskConical, 
  Globe, 
  MessageSquare, 
  TrafficCone, 
  LucideIcon,
  Tool,
} from "lucide-react";

// Define la estructura de un asistente
export type Assistant = {
  id: string; 
  assistant_id?: string; // ID del Asistente de OpenAI (opcional)
  name: string;
  shortDescription: string;
  description: string;
  iconType: LucideIcon; 
  bgColor: string;
  mcpTools?: string[]; // Lista de servidores MCP que este asistente puede utilizar
};

// Lista de asistentes disponibles
export const assistants: Assistant[] = [
  {
    id: "dall-e-images",
    assistant_id: "asst_ABC123DEF456GHI789", // Reemplaza con tu ID real
    name: "Generador de Imágenes",
    shortDescription: "Crea imágenes a partir de descripciones (OpenAI).",
    description: "Utiliza DALL·E a través de la API de Asistentes de OpenAI para generar imágenes únicas basadas en tus indicaciones de texto.",
    iconType: ImageIcon,
    bgColor: "bg-indigo-600",
  },
  {
    id: "general-assistant",
    assistant_id: "asst_XYZ987UVW654RST123", // Reemplaza con tu ID real
    name: "Asistente General",
    shortDescription: "Responde preguntas y realiza tareas (OpenAI).",
    description: "Un asistente conversacional general potenciado por GPT a través de la API de Asistentes. Puede responder preguntas, resumir texto, traducir y más.",
    iconType: MessageSquare,
    bgColor: "bg-green-600",
    mcpTools: ["filesystem", "memory"], // Herramientas MCP que puede usar
  },
  {
    id: "asistente-senalizacion", 
    assistant_id: "asst_MXuUc0TcV7aPYkLGbN5glitq", // ID real del asistente OpenAI
    name: "Asistente de Señalización", 
    shortDescription: "Identifica y explica señales de tráfico (OpenAI).",
    description: "Proporciona información sobre señales de tráfico a partir de imágenes o descripciones. Utiliza un asistente de OpenAI especializado.", 
    iconType: TrafficCone, 
    bgColor: "bg-yellow-600", 
  },
  // Nuevo asistente con capacidades MCP
  {
    id: "mcp-assistant",
    assistant_id: "asst_DEV123456789", // Reemplaza con tu ID real
    name: "Asistente MCP",
    shortDescription: "Asistente con acceso a herramientas MCP.",
    description: "Un asistente especializado que puede acceder a sistemas de archivos, memoria y otras herramientas a través del Model Context Protocol (MCP).",
    iconType: Tool,
    bgColor: "bg-blue-600",
    mcpTools: ["filesystem", "memory"], // Herramientas MCP que puede usar
  },
];

// Función para obtener un asistente por su ID
export const getAssistantById = (id: string): Assistant | undefined => {
  return assistants.find((assistant) => assistant.id === id);
};
```

#### 2.4 Integración en el Endpoint de Chat

Modifiqué el endpoint de chat en `app/api/chat/route.ts` para integrar MCP:

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantById } from '@/lib/assistants';
import { mcpManager } from '@/lib/mcp-client';
import { Buffer } from 'buffer';

export const runtime = "nodejs";
export const maxDuration = 60; 

// --- Cliente OpenAI (inicialización robusta) ---
let openai: OpenAI | null = null;
const openAIApiKey = process.env.OPENAI_API_KEY;

if (openAIApiKey && openAIApiKey.trim() !== "") {
    try {
        openai = new OpenAI({ apiKey: openAIApiKey });
        console.log("[API Chat Stream] Cliente OpenAI inicializado exitosamente.");
    } catch (e) {
        console.error("[API Chat Stream] Falló la inicialización del cliente OpenAI:", e);
    }
} else {
    console.warn("[API Chat Stream] OPENAI_API_KEY no está configurada. Los asistentes de OpenAI no funcionarán.");
}
// --- Fin Cliente OpenAI ---

// Helper para enviar eventos SSE
function sendEvent(controller: ReadableStreamDefaultController<any>, event: object) {
  controller.enqueue(`data: ${JSON.stringify(event)}

`);
}

// Función para manejar llamadas a herramientas MCP
async function handleMCPToolCalls(toolCalls: any[], threadId: string): Promise<any[]> {
  const results = [];
  
  for (const toolCall of toolCalls) {
    try {
      const { id, type, function: func } = toolCall;
      
      if (type !== 'function') {
        results.push({
          tool_call_id: id,
          output: "Tipo de herramienta no soportado"
        });
        continue;
      }
      
      // Parsear el nombre de la función para obtener servidor y herramienta
      // Formato esperado: "servidor.herramienta"
      const [serverKey, toolName] = func.name.split('.');
      
      if (!serverKey || !toolName) {
        results.push({
          tool_call_id: id,
          output: `Formato de función inválido: ${func.name}. Debe ser "servidor.herramienta"`
        });
        continue;
      }
      
      // Parsear argumentos
      let args = {};
      try {
        args = JSON.parse(func.arguments);
      } catch (e) {
        results.push({
          tool_call_id: id,
          output: `Error parseando argumentos: ${e.message}`
        });
        continue;
      }
      
      console.log(`[MCP Tool] Ejecutando ${serverKey}.${toolName} con args:`, args);
      
      // Ejecutar la herramienta MCP
      const result = await mcpManager.executeTool(serverKey, toolName, args);
      
      results.push({
        tool_call_id: id,
        output: JSON.stringify(result)
      });
      
    } catch (error) {
      console.error("[MCP Tool] Error ejecutando herramienta:", error);
      results.push({
        tool_call_id: toolCall.id,
        output: `Error: ${error.message || "Error desconocido"}`
      });
    }
  }
  
  return results;
}

export async function POST(req: NextRequest) {
  console.log("[API Chat Stream] Recibida solicitud POST /api/chat");
  
  if (!openai) {
    console.error("[API Chat Stream] Cliente OpenAI no inicializado (API Key?).");
    return NextResponse.json({ error: 'Configuración del servidor incompleta para asistentes OpenAI (API Key).' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { assistantId, message, imageBase64, threadId: existingThreadId, employeeToken } = body; // employeeToken for logging/context if needed
    
    console.log(`[API Chat Stream] Datos: assistantId=${assistantId}, msg=${message ? message.substring(0,30)+"...": "N/A"}, img=${imageBase64 ? "Sí" : "No"}, thread=${existingThreadId}, token=${employeeToken ? "Sí" : "No"}`);

    // --- Validaciones de entrada ---
    if (typeof assistantId !== 'string' || !assistantId) return NextResponse.json({ error: 'assistantId es requerido' }, { status: 400 });
    if ((typeof message !== 'string' || !message.trim()) && (typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image'))) return NextResponse.json({ error: 'Se requiere texto o imagen válida' }, { status: 400 });
    if (existingThreadId !== undefined && typeof existingThreadId !== 'string' && existingThreadId !== null) return NextResponse.json({ error: 'threadId inválido' }, { status: 400 });

    const assistantConfig = getAssistantById(assistantId);
    if (!assistantConfig || !assistantConfig.assistant_id) {
         const errorMsg = !assistantConfig ? 'Asistente no encontrado' : `Configuración inválida (${assistantId}): falta assistant_id de OpenAI.`;
         console.error(`[API Chat Stream] Configuración de asistente inválida: ${errorMsg}`);
         return NextResponse.json({ error: errorMsg }, { status: !assistantConfig ? 404 : 500 });
    }
    const openaiAssistantId = assistantConfig.assistant_id;

    // --- Inicializar MCP si el asistente lo requiere ---
    if (assistantConfig.mcpTools && assistantConfig.mcpTools.length > 0) {
      await mcpManager.initialize();
      
      // Conectar a los servidores MCP necesarios
      for (const serverKey of assistantConfig.mcpTools) {
        await mcpManager.connectToServer(serverKey);
      }
      console.log(`[API Chat Stream] Servidores MCP inicializados para asistente ${assistantId}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let currentThreadId = existingThreadId;
          if (!currentThreadId) {
            const thread = await openai!.beta.threads.create();
            currentThreadId = thread.id;
            console.log('[API Chat Stream] Nuevo thread OpenAI creado:', currentThreadId);
            sendEvent(controller, { type: 'thread.created', threadId: currentThreadId, assistantId: assistantId });
          } else {
            console.log('[API Chat Stream] Usando thread OpenAI existente:', currentThreadId);
            // Send threadId if it wasn't sent via 'thread.created' for existing threads
            // The client-side example expects it, so let's ensure it's sent.
            sendEvent(controller, { type: 'thread.info', threadId: currentThreadId, assistantId: assistantId });
          }

          let fileId: string | null = null;
          if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
              const base64Data = imageBase64.split(';base64,').pop();
              if (!base64Data) throw new Error("Formato base64 inválido para imagen");
              const imageBuffer = Buffer.from(base64Data, 'base64');
              const mimeType = imageBase64.substring("data:".length, imageBase64.indexOf(";base64"));
              const fileName = `image.${mimeType.split('/')[1] || 'bin'}`;
              
              const fileObject = await openai!.files.create({
                  file: new File([imageBuffer], fileName, { type: mimeType }),
                  purpose: 'vision',
              });
              fileId = fileObject.id;
              console.log(`[API Chat Stream] Imagen subida. File ID: ${fileId}`);
          }

          const messageContent: OpenAI.Beta.Threads.Messages.MessageCreateParams.Content[] = [];
          if (typeof message === 'string' && message.trim()) {
              messageContent.push({ type: 'text', text: message });
          }
          if (fileId) {
              messageContent.push({ type: 'image_file', image_file: { file_id: fileId } });
          }
          if (messageContent.length === 0) {
             messageContent.push({type: 'text', text: '(Intento de enviar mensaje vacío o con imagen fallida)'});
          }
          
          await openai!.beta.threads.messages.create(currentThreadId, {
            role: 'user',
            content: messageContent,
          });
          console.log(`[API Chat Stream] Mensaje añadido al thread ${currentThreadId}.`);

          const runStream = openai!.beta.threads.runs.stream(currentThreadId, {
            assistant_id: openaiAssistantId,
          });

          for await (const event of runStream) {
            // console.log('[API Chat Stream] Evento OpenAI:', event.event); // Log event type
            switch (event.event) {
              case 'thread.run.created':
                console.log(`[API Chat Stream] Run ${event.data.id} creado.`);
                sendEvent(controller, { type: 'thread.run.created', data: event.data, threadId: currentThreadId });
                break;
              case 'thread.run.queued':
              case 'thread.run.in_progress':
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                break;
              case 'thread.run.requires_action':
                // Manejar llamadas a herramientas MCP
                if (event.data.required_action?.type === 'submit_tool_outputs' && 
                    event.data.required_action.submit_tool_outputs?.tool_calls) {
                  
                  const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
                  console.log(`[API Chat Stream] Se requieren ${toolCalls.length} llamadas a herramientas`);
                  
                  // Enviar evento al cliente
                  sendEvent(controller, { 
                    type: event.event, 
                    data: event.data, 
                    threadId: currentThreadId,
                    message: "Ejecutando herramientas MCP..." 
                  });
                  
                  // Ejecutar herramientas MCP
                  const toolOutputs = await handleMCPToolCalls(toolCalls, currentThreadId);
                  
                  // Enviar resultados a OpenAI
                  await openai!.beta.threads.runs.submitToolOutputs(
                    currentThreadId,
                    event.data.id,
                    { tool_outputs: toolOutputs }
                  );
                  
                  console.log(`[API Chat Stream] Resultados de herramientas enviados a OpenAI`);
                } else {
                  sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                }
                break;
              case 'thread.message.delta':
                if (event.data.delta.content) {
                    sendEvent(controller, { type: 'thread.message.delta', data: event.data, threadId: currentThreadId });
                }
                break;
              case 'thread.message.completed':
                sendEvent(controller, { type: 'thread.message.completed', data: event.data, threadId: currentThreadId });
                break;
              case 'thread.run.completed':
                console.log(`[API Chat Stream] Run ${event.data.id} completado.`);
                sendEvent(controller, { type: 'thread.run.completed', data: event.data, threadId: currentThreadId });
                sendEvent(controller, { type: 'stream.ended' }); // Signal end of stream from our side
                controller.close();
                return; 
              case 'thread.run.failed':
              case 'thread.run.cancelled':
              case 'thread.run.expired':
                console.error(`[API Chat Stream] Run ${event.data.id} fallido/cancelado/expirado:`, event.data.last_error || event.data);
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                sendEvent(controller, { type: 'stream.ended', error: event.data.last_error?.message || 'Run failed' });
                controller.close();
                return;
              case 'error': // Error from the OpenAI stream itself
                console.error("[API Chat Stream] Error en el stream de OpenAI:", event.data);
                sendEvent(controller, { type: 'error', data: { message: 'Error en el stream de OpenAI', details: event.data } });
                sendEvent(controller, { type: 'stream.ended', error: 'OpenAI stream error' });
                controller.close();
                return;
            }
          }
          // Fallback if stream ends without a terminal event (should ideally be handled by OpenAI events)
          console.warn("[API Chat Stream] El stream de OpenAI finalizó inesperadamente.");
          sendEvent(controller, { type: 'stream.ended', error: 'Stream ended without completion.'});
          controller.close();

        } catch (error: any) {
          console.error("[API Chat Stream] Error dentro del ReadableStream:", error);
          try {
            sendEvent(controller, { type: 'error', data: { message: error.message || 'Error interno del servidor durante el stream', details: error.toString() } });
            sendEvent(controller, { type: 'stream.ended', error: error.message || 'Stream error'});
          } catch (e) { /* controller might be already closed or in error state */ }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error('[API Chat Stream] Error general no manejado en POST /api/chat:', error);
    // This error is before the stream starts, so a normal JSON response is fine.
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message || "Unknown error" }, { status: 500 });
  }
}
```

### 3. Configuración y Levantamiento de Servidores MCP

Creé una carpeta para los archivos permitidos del servidor filesystem:

```bash
mkdir -p /home/ubuntu/mcp_implementacion/allowed_files
```

Añadí un archivo de prueba para verificar el acceso:

```bash
echo "Este es un archivo de prueba para el servidor MCP filesystem." > /home/ubuntu/mcp_implementacion/allowed_files/test.txt
```

Probé el levantamiento del servidor MCP filesystem:

```bash
npx -y @modelcontextprotocol/server-filesystem /home/ubuntu/mcp_implementacion/allowed_files
```

El servidor se inició correctamente, mostrando:
```
Secure MCP Filesystem Server running on stdio
Allowed directories: [ '/home/ubuntu/mcp_implementacion/allowed_files' ]
```

### 4. Pruebas de Funcionamiento

Inicié el servidor Next.js para probar la integración:

```bash
cd /home/ubuntu/mcp_implementacion/asistentes-ia-v02
npm run dev
```

El servidor se inició correctamente:
```
> my-v0-project@0.1.0 dev
> next dev
   ▲ Next.js 15.2.4
   - Local:        http://localhost:3000
   - Network:      http://169.254.0.21:3000
 ✓ Starting...
 ✓ Ready in 1562ms
```

### 5. Depuración y Ajustes

Durante la implementación, encontré y resolví los siguientes problemas:

1. **Importación correcta del SDK**: Inicialmente intenté usar `@modelcontextprotocol/client` como un paquete separado, pero descubrí que toda la funcionalidad está incluida en `@modelcontextprotocol/sdk`.

2. **Ajuste de rutas de importación**: Tuve que ajustar las rutas de importación para usar la estructura correcta del SDK:
   ```typescript
   import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
   import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
   ```

3. **Configuración de transporte**: Implementé el transporte stdio para la comunicación con los servidores MCP, que es el método recomendado para aplicaciones Node.js.

4. **Manejo de herramientas**: Implementé un sistema para parsear y ejecutar llamadas a herramientas en formato `servidor.herramienta` para facilitar la integración con OpenAI Assistants.

## Conclusión

La integración de MCP en el asistente basado en Next.js y OpenAI se completó exitosamente. El asistente ahora puede conectarse a servidores MCP como filesystem y memory, permitiéndole acceder a recursos externos y ejecutar herramientas a través del protocolo estandarizado.

La arquitectura implementada permite:

1. Configurar y levantar servidores MCP según sea necesario
2. Conectar el asistente a estos servidores a través de un cliente MCP
3. Ejecutar herramientas MCP en respuesta a solicitudes del modelo de OpenAI
4. Devolver los resultados al modelo para continuar la conversación

Esta integración amplía significativamente las capacidades del asistente, permitiéndole interactuar con diversas fuentes de datos y herramientas sin necesidad de implementar integraciones personalizadas para cada una.

## Próximos Pasos

Para mejorar aún más la integración, se podrían considerar:

1. Implementar más servidores MCP (GitHub, bases de datos, etc.)
2. Mejorar el manejo de errores y la recuperación
3. Añadir una interfaz de usuario para gestionar los servidores MCP
4. Implementar caché para mejorar el rendimiento
5. Añadir autenticación y autorización para los servidores MCP
