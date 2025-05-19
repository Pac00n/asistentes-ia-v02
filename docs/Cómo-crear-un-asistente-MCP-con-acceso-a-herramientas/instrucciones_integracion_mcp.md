# Guía de Integración de Model Context Protocol (MCP) en Asistentes IA

## Introducción

Esta guía detalla el proceso para integrar el Model Context Protocol (MCP) en el proyecto de asistente basado en Next.js y OpenAI. El objetivo es permitir que el asistente pueda conectarse a diversas herramientas externas mediante el protocolo MCP, ampliando significativamente sus capacidades sin necesidad de implementar integraciones personalizadas para cada herramienta.

MCP funciona como un "puerto USB-C para aplicaciones de IA", proporcionando una forma estandarizada de conectar modelos de lenguaje con diferentes fuentes de datos y herramientas. Esta integración permitirá que tu asistente utilice una amplia variedad de servidores MCP preexistentes o personalizados.

## Arquitectura General de la Integración

La integración de MCP en tu asistente seguirá esta arquitectura:

1. **Cliente MCP**: Se implementará en tu aplicación Next.js para establecer conexiones con servidores MCP.
2. **Servidores MCP**: Programas ligeros que exponen capacidades específicas a través del protocolo estandarizado.
3. **Gestión de Conexiones**: Lógica para iniciar, mantener y cerrar conexiones con los servidores MCP.
4. **Integración con OpenAI**: Modificaciones en los endpoints de API para permitir que los asistentes de OpenAI utilicen las herramientas expuestas por MCP.

## Requisitos Previos

Antes de comenzar la integración, asegúrate de tener:

1. Node.js 18.0.0 o superior
2. Acceso a la API de OpenAI con una clave válida
3. Conocimientos básicos de Next.js y TypeScript
4. Familiaridad con los conceptos de API y protocolos de comunicación

## Paso 1: Instalación de Dependencias MCP

Primero, instala las dependencias necesarias para trabajar con MCP:

```bash
cd /ruta/a/tu/proyecto
npm install @modelcontextprotocol/client @modelcontextprotocol/sdk
```

O si utilizas pnpm (como parece ser el caso en tu proyecto):

```bash
pnpm add @modelcontextprotocol/client @modelcontextprotocol/sdk
```

## Paso 2: Configuración de Servidores MCP

Crea un archivo de configuración para los servidores MCP que deseas utilizar. Recomendamos crear un nuevo archivo en la carpeta `lib`:

```typescript
// lib/mcp-config.ts

import { spawn } from 'child_process';
import { MCPServer } from '@modelcontextprotocol/sdk';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  server?: MCPServer;
  process?: any;
}

// Configuración de servidores MCP disponibles
export const mcpServers: Record<string, MCPServerConfig> = {
  filesystem: {
    name: "Filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/ruta/permitida"],
    env: {}
  },
  memory: {
    name: "Memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {}
  },
  github: {
    name: "GitHub",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      "GITHUB_PERSONAL_ACCESS_TOKEN": process.env.GITHUB_TOKEN || ""
    }
  },
  // Añade más servidores según necesites
};

// Función para iniciar un servidor MCP
export async function startMCPServer(serverKey: string): Promise<MCPServer | null> {
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
    
    // Esperar a que el servidor esté listo (esto es simplificado, en producción necesitarías una lógica más robusta)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear y devolver instancia del servidor MCP
    const server = new MCPServer({
      name: config.name,
      // Aquí se configuraría la conexión al servidor iniciado
      // En una implementación real, necesitarías obtener el puerto o socket del servidor
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

## Paso 3: Modificación del Modelo de Asistentes

Actualiza el archivo `lib/assistants.ts` para incluir información sobre las herramientas MCP que cada asistente puede utilizar:

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
  Tool, // Añadir este icono
} from "lucide-react";

// Actualiza la estructura de un asistente para incluir herramientas MCP
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

// Lista de asistentes disponibles con herramientas MCP
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
    mcpTools: ["filesystem", "memory", "github"], // Herramientas MCP que puede usar
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
    id: "mcp-developer-assistant",
    assistant_id: "asst_DEV123456789", // Reemplaza con tu ID real
    name: "Asistente de Desarrollo",
    shortDescription: "Ayuda con tareas de desarrollo usando herramientas MCP.",
    description: "Un asistente especializado para desarrolladores que puede acceder a GitHub, sistemas de archivos y otras herramientas a través de MCP.",
    iconType: Tool,
    bgColor: "bg-blue-600",
    mcpTools: ["filesystem", "github"], // Herramientas MCP que puede usar
  },
];

// Función para obtener un asistente por su ID
export const getAssistantById = (id: string): Assistant | undefined => {
  return assistants.find((assistant) => assistant.id === id);
};
```

## Paso 4: Creación del Cliente MCP

Crea un nuevo archivo para gestionar el cliente MCP:

```typescript
// lib/mcp-client.ts

import { MCPClient } from '@modelcontextprotocol/client';
import { startMCPServer, mcpServers } from './mcp-config';

// Clase para gestionar el cliente MCP
export class MCPManager {
  private static instance: MCPManager;
  private client: MCPClient | null = null;
  private activeServers: Set<string> = new Set();
  
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
        this.client = new MCPClient({
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
      
      // Conectar el cliente al servidor
      await this.client!.connect(server);
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
      // En una implementación real, aquí obtendrías las herramientas del servidor
      // Esto es un ejemplo simplificado
      const serverConfig = mcpServers[serverKey];
      if (!serverConfig || !serverConfig.server) {
        return [];
      }
      
      // Obtener herramientas del servidor (implementación ficticia)
      const tools = await serverConfig.server.getTools();
      return tools || [];
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
      // En una implementación real, aquí ejecutarías la herramienta en el servidor
      // Esto es un ejemplo simplificado
      const serverConfig = mcpServers[serverKey];
      if (!serverConfig || !serverConfig.server) {
        throw new Error(`Servidor ${serverKey} no disponible`);
      }
      
      // Ejecutar herramienta (implementación ficticia)
      const result = await serverConfig.server.executeTool(toolName, params);
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
      // En una implementación real, aquí desconectarías del servidor
      const serverConfig = mcpServers[serverKey];
      if (serverConfig && serverConfig.server) {
        await this.client!.disconnect(serverConfig.server);
      }
      
      this.activeServers.delete(serverKey);
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

## Paso 5: Modificación del Endpoint de Chat para Integrar MCP

Modifica el archivo `app/api/chat/route.ts` para integrar MCP con los asistentes de OpenAI:

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
    const { assistantId, message, imageBase64, threadId: existingThreadId, employeeToken } = body;
    
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
                sendEvent(controller, { type: 'stream.ended' });
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
              case 'error':
                console.error("[API Chat Stream] Error en el stream de OpenAI:", event.data);
                sendEvent(controller, { type: 'error', data: { message: 'Error en el stream de OpenAI', details: event.data } });
                sendEvent(controller, { type: 'stream.ended', error: 'OpenAI stream error' });
                controller.close();
                return;
            }
          }
          
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
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message || "Unknown error" }, { status: 500 });
  }
}
```

## Paso 6: Modificación del Endpoint de Chat Directo

También debes modificar el endpoint de chat directo para soportar MCP:

```typescript
// app/api/chat-direct/route.ts
import { NextResponse } from "next/server"
import { getAssistantById } from "@/lib/assistants"
import { mcpManager } from "@/lib/mcp-client"

// Usar el runtime de Node.js
export const runtime = "nodejs"

// Permitir respuestas de hasta 60 segundos
export const maxDuration = 60

// Función para manejar llamadas a herramientas MCP
async function handleMCPToolCalls(toolCalls: any[]): Promise<any[]> {
  const results = [];
  
  for (const toolCall of toolCalls) {
    try {
      const { id, function: func } = toolCall;
      
      // Parsear el nombre de la función para obtener servidor y herramienta
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

export async function POST(req: Request) {
  try {
    const { assistantId, message, threadId } = await req.json()

    // Validar datos
    if (!assistantId || !message) {
      return NextResponse.json({ error: "Se requieren assistantId y message" }, { status: 400 })
    }

    // Obtener la configuración del asistente
    const assistant = getAssistantById(assistantId)
    if (!assistant) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 })
    }

    // Verificar API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key de OpenAI no configurada" }, { status: 500 })
    }

    // --- Inicializar MCP si el asistente lo requiere ---
    if (assistant.mcpTools && assistant.mcpTools.length > 0) {
      await mcpManager.initialize();
      
      // Conectar a los servidores MCP necesarios
      for (const serverKey of assistant.mcpTools) {
        await mcpManager.connectToServer(serverKey);
      }
    }

    const openaiAssistantId = assistant.assistant_id
    const baseUrl = "https://api.openai.com/v1"
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2", // Especificar versión 2 de la API
    }

    // 1. Gestionar el Thread (Hilo)
    let currentThreadId = threadId

    if (!currentThreadId) {
      // Crear un nuevo hilo
      const threadRes = await fetch(`${baseUrl}/threads`, { method: "POST", headers })
      if (!threadRes.ok) {
        const err = await threadRes.json().catch(() => null)
        throw new Error(`Error creando thread: ${err?.error?.message || threadRes.statusText}`)
      }
      const threadData = await threadRes.json()
      currentThreadId = threadData.id
      console.log(`Nuevo thread creado: ${currentThreadId}`)
    } else {
      console.log(`Usando thread existente: ${currentThreadId}`)
    }

    // 2. Añadir el mensaje del usuario al hilo
    const msgBody = { role: "user", content: message }
    const msgRes = await fetch(`${baseUrl}/threads/${currentThreadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify(msgBody),
    })
    if (!msgRes.ok) {
      const err = await msgRes.json().catch(() => null)
      throw new Error(`Error enviando mensaje: ${err?.error?.message || msgRes.statusText}`)
    }
    console.log(`Mensaje añadido al thread: ${message}`)

    // 3. Crear y ejecutar un Run
    console.log(`Creando Run con Assistant ID: ${openaiAssistantId}`)
    const runRes = await fetch(`${baseUrl}/threads/${currentThreadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: openaiAssistantId }),
    })
    if (!runRes.ok) {
      const err = await runRes.json().catch(() => null)
      throw new Error(`Error ejecutando asistente: ${err?.error?.message || runRes.statusText}`)
    }
    const runData = await runRes.json()
    const runId = runData.id
    console.log(`Run creado: ${runId}`)

    // 4. Polling estado
    let status = runData.status
    let attempts = 0
    const maxAttempts = 30 // Máximo 30 intentos (30 segundos con 1 segundo de espera)

    while (["queued", "in_progress", "cancelling"].includes(status) && attempts < maxAttempts) {
      // Esperar 1 segundo entre cada consulta
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++

      // Obtener el estado actual del run
      const statusRes = await fetch(`${baseUrl}/threads/${currentThreadId}/runs/${runId}`, { headers })
      if (!statusRes.ok) {
        const err = await statusRes.json().catch(() => null)
        throw new Error(`Error obteniendo estado del run: ${err?.error?.message || statusRes.statusText}`)
      }
      const statusData = await statusRes.json()
      status = statusData.status
      console.log(`Estado del run (intento ${attempts}): ${status}`)
      
      // Manejar llamadas a herramientas MCP
      if (status === "requires_action" && 
          statusData.required_action?.type === "submit_tool_outputs" &&
          statusData.required_action.submit_tool_outputs?.tool_calls) {
        
        const toolCalls = statusData.required_action.submit_tool_outputs.tool_calls;
        console.log(`[API Chat Direct] Se requieren ${toolCalls.length} llamadas a herramientas`);
        
        // Ejecutar herramientas MCP
        const toolOutputs = await handleMCPToolCalls(toolCalls);
        
        // Enviar resultados a OpenAI
        const submitRes = await fetch(`${baseUrl}/threads/${currentThreadId}/runs/${runId}/submit_tool_outputs`, {
          method: "POST",
          headers,
          body: JSON.stringify({ tool_outputs: toolOutputs }),
        });
        
        if (!submitRes.ok) {
          const err = await submitRes.json().catch(() => null);
          throw new Error(`Error enviando resultados de herramientas: ${err?.error?.message || submitRes.statusText}`);
        }
        
        // Actualizar estado después de enviar resultados
        status = "in_progress";
        console.log(`[API Chat Direct] Resultados de herramientas enviados a OpenAI`);
      }
    }

    // 5. Comprobar el estado final
    if (status !== "completed") {
      console.error(`Run no completado. Estado final: ${status}`)

      if (status === "requires_action") {
        return NextResponse.json(
          {
            error: "El asistente requiere acciones adicionales que no están implementadas en esta versión",
          },
          { status: 501 },
        )
      }

      return NextResponse.json(
        {
          error: `Error en la ejecución del asistente: ${status}`,
        },
        { status: 500 },
      )
    }

    // 6. Recuperar la respuesta del asistente
    const messagesRes = await fetch(`${baseUrl}/threads/${currentThreadId}/messages?order=asc`, { headers })
    if (!messagesRes.ok) {
      const err = await messagesRes.json().catch(() => null)
      throw new Error(`Error obteniendo mensajes: ${err?.error?.message || messagesRes.statusText}`)
    }
    const messagesData = await messagesRes.json()

    // Verificar que hay mensajes
    if (!messagesData.data || messagesData.data.length === 0) {
      throw new Error("No se encontraron mensajes en el thread")
    }

    // Encontrar la última respuesta del asistente para este run
    const assistantResponses = messagesData.data.filter((msg) => {
      return msg && msg.role === "assistant" && msg.run_id === runId
    })

    // Verificar que hay respuestas del asistente
    if (!assistantResponses || assistantResponses.length === 0) {
      throw new Error("No se encontraron respuestas del asistente para este run")
    }

    const lastAssistantMessage = assistantResponses[assistantResponses.length - 1]
    let assistantReply = "No se encontró respuesta del asistente." // Mensaje por defecto

    // Verificar que el mensaje y su contenido existen
    if (lastAssistantMessage && lastAssistantMessage.content && lastAssistantMessage.content.length > 0) {
      // Buscar el primer contenido de tipo texto
      for (const contentPart of lastAssistantMessage.content) {
        if (contentPart && contentPart.type === "text" && contentPart.text && contentPart.text.value) {
          assistantReply = contentPart.text.value
          break
        }
      }
    } else {
      console.warn("El formato del mensaje del asistente no es el esperado:", lastAssistantMessage)
    }

    console.log("Respuesta del Asistente:", assistantReply)

    // Enviar la respuesta al frontend
    return NextResponse.json({
      reply: assistantReply,
      threadId: currentThreadId,
    })
  } catch (error) {
    console.error("Error en la API de chat:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor al procesar la solicitud de chat.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
```

## Paso 7: Configuración de Herramientas en OpenAI

Para que los asistentes de OpenAI puedan utilizar las herramientas MCP, debes configurar las herramientas en el panel de OpenAI. Aquí hay un ejemplo de cómo definir una herramienta MCP para un asistente:

1. Accede al [panel de OpenAI](https://platform.openai.com/assistants)
2. Selecciona o crea un asistente
3. En la sección "Tools", añade una herramienta de tipo "Function"
4. Define la función con el formato `servidor.herramienta`, por ejemplo:

```json
{
  "name": "filesystem.readFile",
  "description": "Lee el contenido de un archivo del sistema de archivos",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Ruta del archivo a leer"
      }
    },
    "required": ["path"]
  }
}
```

5. Repite este proceso para cada herramienta que desees exponer al asistente

## Paso 8: Gestión del Ciclo de Vida de los Servidores MCP

Para gestionar adecuadamente el ciclo de vida de los servidores MCP, crea un archivo de middleware:

```typescript
// middleware/mcp-lifecycle.ts

import { NextResponse } from 'next/server';
import { mcpManager } from '@/lib/mcp-client';

// Esta función se ejecutará al iniciar la aplicación
export async function initializeMCP() {
  try {
    await mcpManager.initialize();
    console.log("[MCP Lifecycle] Cliente MCP inicializado correctamente");
    return true;
  } catch (error) {
    console.error("[MCP Lifecycle] Error inicializando cliente MCP:", error);
    return false;
  }
}

// Esta función se ejecutará al cerrar la aplicación
export async function cleanupMCP() {
  try {
    await mcpManager.cleanup();
    console.log("[MCP Lifecycle] Recursos MCP liberados correctamente");
    return true;
  } catch (error) {
    console.error("[MCP Lifecycle] Error liberando recursos MCP:", error);
    return false;
  }
}

// Middleware para gestionar el ciclo de vida de MCP
export function middleware(request) {
  // Aquí podrías implementar lógica adicional si es necesario
  return NextResponse.next();
}
```

## Paso 9: Actualización de Variables de Entorno

Actualiza el archivo `.env` o `.env.local` para incluir las variables necesarias para MCP:

```
# OpenAI
OPENAI_API_KEY=tu_clave_api_de_openai

# MCP Configuration
MCP_ENABLED=true
MCP_LOG_LEVEL=info

# GitHub MCP Server (ejemplo)
GITHUB_TOKEN=tu_token_de_github

# Otras variables específicas para servidores MCP
```

## Paso 10: Prueba y Depuración

Para probar la integración de MCP:

1. Inicia tu aplicación en modo desarrollo:

```bash
npm run dev
```

2. Abre la consola del navegador para ver los logs de MCP
3. Interactúa con un asistente que tenga herramientas MCP configuradas
4. Verifica que las herramientas se ejecuten correctamente

Para depuración avanzada, puedes utilizar la herramienta MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

## Consideraciones Adicionales

### Seguridad

- Limita el acceso a recursos sensibles en los servidores MCP
- Utiliza variables de entorno para almacenar tokens y credenciales
- Implementa validación de entrada para todas las llamadas a herramientas MCP

### Rendimiento

- Inicializa los servidores MCP solo cuando sean necesarios
- Considera implementar un sistema de caché para resultados frecuentes
- Monitorea el uso de memoria y CPU de los servidores MCP

### Escalabilidad

- Para entornos de producción, considera implementar un sistema de gestión de servidores MCP más robusto
- Implementa reintentos y manejo de errores para conexiones fallidas
- Considera utilizar un sistema de colas para llamadas a herramientas que requieran mucho tiempo

## Recursos Adicionales

- [Documentación oficial de MCP](https://modelcontextprotocol.io)
- [Repositorio de MCP en GitHub](https://github.com/modelcontextprotocol)
- [Ejemplos de servidores MCP](https://github.com/modelcontextprotocol/servers)
- [Documentación de la API de OpenAI Assistants](https://platform.openai.com/docs/assistants/overview)

## Conclusión

La integración de MCP en tu asistente basado en Next.js y OpenAI te permite conectar tu aplicación con una amplia variedad de herramientas y fuentes de datos de forma estandarizada. Siguiendo esta guía, has implementado la infraestructura necesaria para que tus asistentes puedan utilizar herramientas MCP, ampliando significativamente sus capacidades.

Esta integración te permite aprovechar el ecosistema creciente de servidores MCP, facilitando la conexión con servicios como GitHub, sistemas de archivos, bases de datos y muchas otras herramientas sin necesidad de implementar integraciones personalizadas para cada una.
