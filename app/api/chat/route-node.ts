import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getAssistantById } from "@/lib/assistants"
import { MCPAdapter } from "@/lib/mcp_adapter"; // Importar MCPAdapter
import { createClient } from '@supabase/supabase-js'; // Importar Supabase client

// Usar el runtime de Node.js en lugar de Edge si hay problemas con Edge
export const runtime = "nodejs"

// Permitir respuestas de hasta 60 segundos
export const maxDuration = 60

export async function POST(req: Request) {
  // LOG DE PRUEBA V4
  console.log("--- ROUTE-NODE.TS V4 EXECUTION --- API Chat Endpoint Start ---");
  try {
    // Añadir employeeToken a la desestructuración si se espera del frontend
    const { assistantId, message, threadId, employeeToken } = await req.json()

    // Validar datos
    if (!assistantId || !message) {
      return NextResponse.json({ error: "Se requieren assistantId y message" }, { status: 400 })
    }

    // Obtener la configuración del asistente
    const assistant = getAssistantById(assistantId)
    if (!assistant) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 })
    }
    
    // Usar el ID real del asistente de OpenAI de nuestra configuración interna
    const openaiAssistantId = assistant.openaiAssistantId;

    // VERIFICACIÓN EXPLÍCITA AÑADIDA:
    if (!openaiAssistantId) {
      console.error(`Error crítico V4: El asistente con ID interno '${assistant.id}' y nombre '${assistant.name}' no tiene un 'openaiAssistantId' configurado en lib/assistants.ts.`);
      return NextResponse.json({ error: `Configuración interna inválida V4 para el asistente '${assistant.name}'. Falta el ID de OpenAI.` }, { status: 500 });
    }
    // FIN DE LA VERIFICACIÓN AÑADIDA

    // Inicializar el cliente de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API key de OpenAI no configurada" }, { status: 500 })
    }
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Inicializar el cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // O SUPABASE_ANON_KEY si es apropiado

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase URL o Key no configuradas");
      return NextResponse.json({ error: "Configuración de Supabase incompleta" }, { status: 500 });
    }
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Inicializar MCPAdapter
    const mcpAdapter = new MCPAdapter(supabaseClient, openai);
    try {
      await mcpAdapter.initialize();
      console.log("MCPAdapter inicializado correctamente.");
    } catch (initError) {
      console.error("Error inicializando MCPAdapter:", initError);
    }

    let currentThreadId = threadId
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create()
      currentThreadId = thread.id
      console.log(`Nuevo thread creado: ${currentThreadId}`)
    } else {
      console.log(`Usando thread existente: ${currentThreadId}`)
    }

    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: message,
    })
    console.log(`Mensaje añadido al thread: ${message}`)

    const mcpToolsForOpenAI = await mcpAdapter.getToolsForAssistant(assistantId);
    console.log(`Herramientas MCP para OpenAI: ${JSON.stringify(mcpToolsForOpenAI, null, 2)}`);

    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: openaiAssistantId, 
      tools: mcpToolsForOpenAI.length > 0 ? mcpToolsForOpenAI : undefined,
    })
    console.log(`Run creado: ${run.id}`)

    let currentRun = run
    let attempts = 0
    const maxAttempts = 30 

    while (["queued", "in_progress", "cancelling"].includes(currentRun.status) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++
      currentRun = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      console.log(`Estado del run (intento ${attempts}): ${currentRun.status}`)

      if (currentRun.status === "requires_action") {
        console.log("Run requiere acción. Procesando tool calls...");
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
                console.error(`Error parseando argumentos para ${functionName}:`, parseError);
              }
              
              if (functionName.startsWith('mcp_')) {
                console.log(`Ejecutando herramienta MCP: ${functionName} con args:`, functionArgs);
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
                console.warn(`Llamada a función desconocida: ${functionName}. No es una herramienta MCP.`);
                toolOutputs.push({
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ error: `Función ${functionName} no implementada.` }),
                });
              }
            }
          }

          if (toolOutputs.length > 0) {
            console.log("Enviando tool outputs:", toolOutputs);
            try {
              currentRun = await openai.beta.threads.runs.submitToolOutputs(
                currentThreadId,
                run.id,
                { tool_outputs: toolOutputs }
              );
              console.log(`Tool outputs enviados. Nuevo estado del run: ${currentRun.status}`);
            } catch (submitError) {
              console.error("Error enviando tool outputs:", submitError);
              return NextResponse.json(
                { error: "Error enviando resultados de herramientas a OpenAI", details: submitError.message },
                { status: 500 }
              );
            }
          }
        } else {
           console.error("Run requiere una acción desconocida o no manejada:", requiredAction);
           return NextResponse.json(
             { error: "El asistente requiere una acción desconocida." },
             { status: 501 }
           );
        }
      }
    } 

    if (currentRun.status !== "completed") {
      console.error(`Run no completado. Estado final: ${currentRun.status}. Required Action: ${JSON.stringify(currentRun.required_action)}`)
      return NextResponse.json(
        {
          error: `Error en la ejecución del asistente: ${currentRun.status}`,
          details: `Última acción requerida: ${JSON.stringify(currentRun.required_action)}`
        },
        { status: 500 },
      )
    }

    const messages = await openai.beta.threads.messages.list(currentThreadId, {
      order: "desc", 
      limit: 1, 
    })

    if (messages.data.length === 0 || messages.data[0].role !== "assistant") {
      console.error("No se encontró respuesta del asistente")
      return NextResponse.json({ error: "No se pudo obtener una respuesta del asistente" }, { status: 500 })
    }

    let assistantResponseContent = ""
    for (const contentPart of messages.data[0].content) {
      if (contentPart.type === "text") {
        assistantResponseContent += contentPart.text.value
      }
    }

    return NextResponse.json({
      reply: assistantResponseContent,
      threadId: currentThreadId,
    })
  } catch (error) {
    console.error("Error en la API de chat:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
