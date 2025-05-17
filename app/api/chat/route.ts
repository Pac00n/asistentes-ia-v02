// app/api/chat/route-node.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAssistantById } from "@/lib/assistants";
import { MCPAdapter } from "@/lib/mcp_adapter"; // Adaptador MCP
import { createClient } from '@supabase/supabase-js'; // Cliente Supabase

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  console.log("--- MCP INTEGRATION ROUTE-NODE.TS --- V1 --- POST request received ---");

  try {
    // Parsear la solicitud
    const body = await req.json().catch(() => ({}));
    const { assistantId, message, threadId: existingThreadId, employeeToken } = body;
    console.log(`MCP route-node.ts: Request para assistantId=${assistantId}, empleado=${employeeToken || "anónimo"}`);

    if (!assistantId) {
      return NextResponse.json({ error: "assistantId es requerido" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Se requiere un mensaje de texto" }, { status: 400 });
    }

    // Inicializar OpenAI - Usando valores hardcodeados temporalmente
    // NOTA: Estos valores deberían estar en variables de entorno en producción
    const openAIApiKey = "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";
    
    console.log(`MCP route-node.ts: Usando API key de OpenAI directamente del código (longitud: ${openAIApiKey.length})`);
    
    let openai: OpenAI;
    try {
      openai = new OpenAI({ apiKey: openAIApiKey });
      console.log("MCP route-node.ts: Cliente OpenAI inicializado correctamente");
    } catch (openaiInitError: any) {
      console.error("MCP route-node.ts: Error inicializando cliente OpenAI:", openaiInitError);
      return NextResponse.json({ 
        error: "Error inicializando cliente OpenAI", 
        details: openaiInitError.message || 'Error desconocido'
      }, { status: 500 });
    }

    // Obtener configuración del asistente
    const assistant = getAssistantById(assistantId);
    if (!assistant) {
      console.error(`MCP route-node.ts: Asistente no encontrado para id: ${assistantId}`);
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 });
    }

    const openaiAssistantId = assistant.openaiAssistantId;
    if (!openaiAssistantId) {
      console.error(`MCP route-node.ts: Configuración interna inválida para el asistente '${assistant.name}': falta openaiAssistantId en lib/assistants.ts.`);
      return NextResponse.json({ error: `Configuración interna inválida para el asistente '${assistant.name}'` }, { status: 500 });
    }

    // Inicializar el cliente de Supabase - Usando valores hardcodeados temporalmente
    // NOTA: Estos valores deberían estar en variables de entorno en producción
    const supabaseUrl = "https://jicyrqayowgaepkvalno.supabase.co";
    const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY3lycWF5b3dnYWVwa3ZhbG5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTk2NjA4NiwiZXhwIjoyMDYxNTQyMDg2fQ.JNEJpIlTCeXOylmKdFSEipod5VOaauLvpWbL2o6GFjQ";

    console.log("MCP route-node.ts: Usando credenciales de Supabase hardcodeadas");
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log("MCP route-node.ts: Cliente Supabase inicializado correctamente");

    // Inicializar MCPAdapter
    const mcpAdapter = new MCPAdapter(supabaseClient, openai);
    try {
      await mcpAdapter.initialize();
      console.log("MCP route-node.ts: MCPAdapter inicializado correctamente.");
    } catch (initError) {
      console.error("MCP route-node.ts: Error inicializando MCPAdapter:", initError);
      // Continuamos y las herramientas MCP podrían estar vacías en caso de error
    }

    // Crear o usar thread existente
    let currentThreadId = existingThreadId;
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
      console.log(`MCP route-node.ts: Nuevo thread OpenAI creado: ${currentThreadId}`);
    } else {
      console.log(`MCP route-node.ts: Usando thread OpenAI existente: ${currentThreadId}`);
    }

    // Añadir mensaje del usuario al thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: message,
    });
    console.log(`MCP route-node.ts: Mensaje añadido al thread ${currentThreadId}`);

    // Obtener herramientas MCP para OpenAI
    const mcpToolsForOpenAI = await mcpAdapter.getToolsForAssistant(assistantId);
    console.log(`MCP route-node.ts: Herramientas MCP para OpenAI: ${JSON.stringify(mcpToolsForOpenAI, null, 2)}`);

    // Crear el Run con las herramientas MCP
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: openaiAssistantId,
      tools: mcpToolsForOpenAI.length > 0 ? mcpToolsForOpenAI : undefined,
    });
    
    // Esperar a que el run termine (polling)
    console.log(`MCP route-node.ts: Run ${run.id} iniciado para el thread ${currentThreadId}`);
    let currentRun = run;
    let attempts = 0;
    const maxAttempts = 30; // ~30 segundos máximo

    while (["queued", "in_progress", "cancelling"].includes(currentRun.status) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentRun = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
      attempts++;
      console.log(`MCP route-node.ts: Estado del run: ${currentRun.status}, intento ${attempts}/${maxAttempts}`);

      // Manejar 'requires_action' para tool calls
      if (currentRun.status === "requires_action") {
        console.log("MCP route-node.ts: Run requiere acción. Procesando tool calls...");
        const requiredAction = currentRun.required_action;
        if (requiredAction && requiredAction.type === 'submit_tool_outputs') {
          const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
          const toolOutputs = [];

          for (const toolCall of toolCalls) {
            if (toolCall.type === 'function') {
              const functionName = toolCall.function.name;
              let functionArgs = {};
              try {
                functionArgs = JSON.parse(toolCall.function.arguments);
              } catch (parseError) {
                console.error(`MCP route-node.ts: Error parseando argumentos para ${functionName}:`, parseError);
              }
              
              if (functionName.startsWith('mcp_')) {
                console.log(`MCP route-node.ts: Ejecutando herramienta MCP: ${functionName} con args:`, functionArgs);
                const output = await mcpAdapter.executeToolCall(
                  toolCall.id,
                  functionName,
                  functionArgs,
                  assistantId, 
                  currentThreadId,
                  employeeToken
                );
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify(output),
                });
              } else {
                console.warn(`MCP route-node.ts: Llamada a función desconocida: ${functionName}. No es una herramienta MCP.`);
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: `Función ${functionName} no implementada.` }),
                });
              }
            }
          }

          if (toolOutputs.length > 0) {
            console.log("MCP route-node.ts: Enviando tool outputs:", toolOutputs);
            try {
              currentRun = await openai.beta.threads.runs.submitToolOutputs(
                currentThreadId,
                run.id,
                { tool_outputs: toolOutputs }
              );
              console.log(`MCP route-node.ts: Tool outputs enviados. Nuevo estado del run: ${currentRun.status}`);
            } catch (submitError: any) {
              console.error("MCP route-node.ts: Error enviando tool outputs:", submitError);
              return NextResponse.json(
                { error: "Error enviando resultados de herramientas a OpenAI", details: submitError.message || 'Error desconocido' },
                { status: 500 }
              );
            }
          }
        } else {
          console.error("MCP route-node.ts: Run requiere una acción desconocida o no manejada:", requiredAction);
          return NextResponse.json(
            { error: "El asistente requiere una acción desconocida." },
            { status: 501 }
          );
        }
      }
    }

    // Verificar si el run se completó o falló
    if (currentRun.status !== "completed") {
      console.error(`MCP route-node.ts: Run no completado. Estado final: ${currentRun.status}. Required Action: ${JSON.stringify(currentRun.required_action)}`);
      return NextResponse.json({
        error: `Error en la ejecución del asistente: ${currentRun.status}`,
        details: `Última acción requerida: ${JSON.stringify(currentRun.required_action)}`
      }, { status: 500 });
    }

    // Obtener el último mensaje del asistente
    const messages = await openai.beta.threads.messages.list(currentThreadId, {
      order: "desc",
      limit: 1,
    });

    // Procesar la respuesta
    if (messages.data.length === 0 || messages.data[0].role !== "assistant") {
      console.error("MCP route-node.ts: No se encontró respuesta del asistente");
      return NextResponse.json({ error: "No se pudo obtener una respuesta del asistente" }, { status: 500 });
    }

    let assistantResponseContent = "";
    for (const contentPart of messages.data[0].content) {
      if (contentPart.type === "text") {
        assistantResponseContent += contentPart.text.value;
      }
    }

    return NextResponse.json({
      reply: assistantResponseContent,
      threadId: currentThreadId,
    });

  } catch (error) {
    console.error("MCP route-node.ts: Error en la API de chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Handler GET simple para verificar que la ruta funciona
export async function GET(req: Request) {
  console.log("--- MCP INTEGRATION ROUTE-NODE.TS --- V1 --- GET request received ---");
  return NextResponse.json(
    {
      message: "MCP Integration API is running (GET endpoint)",
      status: "active",
    },
    { status: 200 }
  );
}
