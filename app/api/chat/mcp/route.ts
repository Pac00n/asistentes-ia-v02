import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { executeTool, registry } from "@/lib/mcp/registry";

// export const runtime = "edge"; // Usar Edge Runtime para streaming (Comentado para probar con Node.js runtime por problemas con mathjs)

// Función para crear un stream de texto
function createStream() {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  return {
    stream: stream.readable,
    async write(text: string) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
    },
    async writeToolCall(toolCall: any) {
      // Asegurar que el objeto es serializable
      const serializableToolCall = {
        id: toolCall.id,
        name: toolCall.name,
        arguments: toolCall.arguments
      };
      await writer.write(encoder.encode(`data: ${JSON.stringify({ toolCall: serializableToolCall })}\n\n`));
    },
    async writeToolResult(result: any) {
      // Asegurar que el resultado es serializable
      const serializableResult = typeof result === 'object' && result !== null 
        ? JSON.parse(JSON.stringify(result)) 
        : result;
      
      await writer.write(encoder.encode(`data: ${JSON.stringify({ toolResult: serializableResult })}\n\n`));
    },
    async close() {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Crear stream para respuesta
    const { stream, write, writeToolCall, writeToolResult, close } = createStream();
    
    // Inicializar OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Crear la respuesta de streaming
    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
    // Procesar en background
    (async () => {
      try {
        // Crear la solicitud a OpenAI con streaming
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // o el modelo que prefieras
          messages,
          stream: true,
          tools: registry.toolsMeta.map(tool => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            }
          })),
          tool_choice: "auto",
        });
        
        let currentToolCall: any = null;
        
        // Procesar la respuesta en streaming
        for await (const chunk of completion) {
          // Procesar contenido de texto
          if (chunk.choices[0]?.delta?.content) {
            await write(chunk.choices[0].delta.content);
          }
          
          // Procesar llamadas a herramientas
          if (chunk.choices[0]?.delta?.tool_calls) {
            const toolCalls = chunk.choices[0].delta.tool_calls;
            
            for (const toolCall of toolCalls) {
              // Iniciar una nueva llamada a herramienta
              if (toolCall.index !== undefined && currentToolCall === null) {
                currentToolCall = {
                  id: toolCall.id,
                  name: toolCall.function?.name,
                  arguments: toolCall.function?.arguments || "",
                };
              } 
              // Actualizar llamada a herramienta existente
              else if (currentToolCall) {
                if (toolCall.function?.name) {
                  currentToolCall.name = toolCall.function.name;
                }
                if (toolCall.function?.arguments) {
                  currentToolCall.arguments += toolCall.function.arguments;
                }
              }
            }
          }
          
          // Si la herramienta está completa, ejecutarla
          if (currentToolCall && chunk.choices[0]?.finish_reason === "tool_calls") {
            try {
              // Notificar sobre la llamada a herramienta
              await writeToolCall(currentToolCall);
              
              // Parsear argumentos JSON
              let args = {};
              try {
                args = JSON.parse(currentToolCall.arguments);
              } catch (e) {
                console.error("Error al parsear argumentos:", e);
              }
              
              // Ejecutar la herramienta
              const result = await executeTool({
                name: currentToolCall.name,
                arguments: args
              });
              
              // Convertir el resultado a un objeto serializable
              const serializableResult = JSON.parse(JSON.stringify({
                toolCallId: currentToolCall.id,
                result
              }));
              
              // Enviar resultado de la herramienta
              await writeToolResult(serializableResult);
              
              // Continuar la conversación con el resultado
              const toolResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                  ...messages,
                  {
                    role: "assistant",
                    content: null,
                    tool_calls: [{
                      id: currentToolCall.id,
                      type: "function",
                      function: {
                        name: currentToolCall.name,
                        arguments: currentToolCall.arguments
                      }
                    }]
                  },
                  {
                    role: "tool",
                    tool_call_id: currentToolCall.id,
                    content: JSON.stringify(result)
                  }
                ],
                stream: true
              });
              
              // Procesar la respuesta continuada
              for await (const chunk of toolResponse) {
                if (chunk.choices[0]?.delta?.content) {
                  await write(chunk.choices[0].delta.content);
                }
              }
              
              // Resetear la herramienta actual
              currentToolCall = null;
            } catch (error) {
              console.error("Error al ejecutar herramienta:", error);
              // Asegurar que el error es serializable
              const errorMessage = error instanceof Error ? error.message : "Error desconocido";
              await writeToolResult({
                error: errorMessage
              });
              currentToolCall = null;
            }
          }
        }
        
        // Cerrar el stream
        await close();
      } catch (error) {
        console.error("Error en el procesamiento:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        await write(`Error: ${errorMessage}`);
        await close();
      }
    })();
    
    return response;
  } catch (error) {
    console.error("Error en la ruta API:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
