// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Assistant, getAssistantById } from '@/lib/assistants';
import { mcpManager } from '@/lib/mcp-client';
import { Buffer } from 'buffer';

export const runtime = "nodejs";
export const maxDuration = 180;

let openai: OpenAI | null = null;
const openAIApiKey = process.env.OPENAI_API_KEY;

if (openAIApiKey && openAIApiKey.trim() !== "") {
    try {
        openai = new OpenAI({ apiKey: openAIApiKey });
        console.log("[API Chat Stream] OpenAI client initialized successfully.");
    } catch (e) {
        console.error("[API Chat Stream] Failed to initialize OpenAI client:", e);
    }
} else {
    console.warn("[API Chat Stream] OPENAI_API_KEY is not configured. OpenAI assistants will not work.");
}

function sendEvent(controller: ReadableStreamDefaultController<any>, event: object) {
  controller.enqueue(`data: ${JSON.stringify(event)}

`);
}

async function handleMCPToolCalls(
  toolCalls: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[], 
  currentThreadId: string,
  controller: ReadableStreamDefaultController<any>
): Promise<OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]> {
  const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];

  sendEvent(controller, { 
    type: 'tools.calling', 
    data: { count: toolCalls.length }, 
    threadId: currentThreadId,
    message: `Ejecutando ${toolCalls.length} herramienta(s) MCP...` 
  });
  console.log(`[API Chat Stream] [MCP] Handling ${toolCalls.length} tool call(s) for thread ${currentThreadId}`);

  for (const toolCall of toolCalls) {
    const { id: toolCallId, function: func } = toolCall;
    const { name: openaiFunctionName, arguments: functionArgs } = func;
    let output: any;
    let serverKey: string | undefined;
    let toolName: string | undefined;

    try {
      console.log(`[API Chat Stream] [MCP] Received OpenAI tool call: ${openaiFunctionName}, Args: ${functionArgs}`);
      sendEvent(controller, { 
        type: 'tool.calling', 
        data: { toolCallId, functionName: openaiFunctionName }, 
        threadId: currentThreadId,
        message: `Llamando a la herramienta: ${openaiFunctionName}...` 
      });

      // Convert OpenAI function name (e.g., "filesystem_readFile") to MCP format ("filesystem.readFile")
      // by replacing the first underscore with a dot.
      const mcpFunctionName = openaiFunctionName.replace('_', '.');
      const parts = mcpFunctionName.split('.');
      serverKey = parts[0];
      toolName = parts.slice(1).join('.'); // toolName can itself contain dots if server registered like that

      if (!serverKey || !toolName || !mcpFunctionName.includes('.')) {
        console.error(`[API Chat Stream] [MCP] Failed to parse serverKey and toolName from function: ${openaiFunctionName} (converted to ${mcpFunctionName})`);
        throw new Error(`Invalid function name format for MCP: ${openaiFunctionName}. Expected 'serverKey_toolName' from OpenAI.`);
      }
      console.log(`[API Chat Stream] [MCP] OpenAI function '${openaiFunctionName}' converted to MCP '${mcpFunctionName}' (Server: ${serverKey}, Tool: ${toolName})`);

      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(functionArgs);
      } catch (e: any) {
        throw new Error(`Error parsing arguments for ${openaiFunctionName}: ${e.message}`);
      }

      const result = await mcpManager.executeTool(serverKey, toolName, parsedArgs);
      output = JSON.stringify(result);
      
      console.log(`[API Chat Stream] [MCP] Tool ${openaiFunctionName} (-> ${mcpFunctionName}) executed. Result: ${output.substring(0,100)}...`);
      sendEvent(controller, { 
        type: 'tool.called', 
        data: { toolCallId, functionName: openaiFunctionName, mcpFunctionName, result: output }, 
        threadId: currentThreadId,
        message: `Herramienta ${openaiFunctionName} ejecutada.` 
      });

    } catch (error: any) {
      console.error(`[API Chat Stream] [MCP] Error executing tool ${openaiFunctionName} (-> ${serverKey}.${toolName}):`, error);
      output = JSON.stringify({ error: error.message || "Unknown error during MCP tool execution" });
      sendEvent(controller, { 
        type: 'tool.error', 
        data: { toolCallId, functionName: openaiFunctionName, error: error.message }, 
        threadId: currentThreadId,
        message: `Error en herramienta ${openaiFunctionName}: ${error.message}` 
      });
    }
    toolOutputs.push({ tool_call_id: toolCallId, output });
  }
  return toolOutputs;
}

export async function POST(req: NextRequest) {
  console.log("[API Chat Stream] Received POST request /api/chat");
  
  if (!openai) {
    console.error("[API Chat Stream] OpenAI client not initialized (API Key?).");
    return NextResponse.json({ error: 'Server configuration incomplete for OpenAI assistants (API Key).' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { assistantId, message, imageBase64, threadId: existingThreadId } = body;
    
    console.log(`[API Chat Stream] Data: assistantId=${assistantId}, msg=${message ? message.substring(0,30)+"...": "N/A"}, img=${imageBase64 ? "Yes" : "No"}, thread=${existingThreadId}`);

    if (typeof assistantId !== 'string' || !assistantId) return NextResponse.json({ error: 'assistantId is required' }, { status: 400 });
    if ((typeof message !== 'string' || !message.trim()) && (typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image'))) return NextResponse.json({ error: 'Valid text or image is required' }, { status: 400 });
    if (existingThreadId !== undefined && typeof existingThreadId !== 'string' && existingThreadId !== null) return NextResponse.json({ error: 'Invalid threadId' }, { status: 400 });

    const assistantConfig: Assistant | undefined = getAssistantById(assistantId);
    if (!assistantConfig || !assistantConfig.assistant_id) {
         const errorMsg = !assistantConfig ? 'Assistant not found' : `Invalid configuration for ${assistantId}: missing OpenAI assistant_id.`;
         console.error(`[API Chat Stream] Invalid assistant configuration: ${errorMsg}`);
         return NextResponse.json({ error: errorMsg }, { status: !assistantConfig ? 404 : 500 });
    }
    const openaiAssistantId = assistantConfig.assistant_id;

    if (assistantConfig.mcpTools && assistantConfig.mcpTools.length > 0) {
      console.log(`[API Chat Stream] [MCP] Assistant ${assistantId} uses MCP tools: ${assistantConfig.mcpTools.join(', ')}`);
      const initialized = await mcpManager.initialize();
      if (initialized) {
        for (const serverKey of assistantConfig.mcpTools) {
          await mcpManager.connectToServer(serverKey);
        }
      } else {
        console.error("[API Chat Stream] [MCP] MCP Manager failed to initialize. MCP tools may not be available.");
      }
    } else {
      console.log(`[API Chat Stream] Assistant ${assistantId} does not use MCP tools.`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        let currentThreadId = existingThreadId;
        try {
          if (!currentThreadId) {
            const thread = await openai!.beta.threads.create();
            currentThreadId = thread.id;
            console.log('[API Chat Stream] New OpenAI thread created:', currentThreadId);
            sendEvent(controller, { type: 'thread.created', threadId: currentThreadId, assistantId: assistantId });
          } else {
            console.log('[API Chat Stream] Using existing OpenAI thread:', currentThreadId);
            sendEvent(controller, { type: 'thread.info', threadId: currentThreadId, assistantId: assistantId });
          }

          let fileId: string | null = null;
          if (typeof imageBase64 === 'string' && imageBase64.startsWith('data:image')) {
              const base64Data = imageBase64.split(';base64,').pop();
              if (!base64Data) throw new Error("Invalid base64 format for image");
              const imageBuffer = Buffer.from(base64Data, 'base64');
              const mimeType = imageBase64.substring("data:".length, imageBase64.indexOf(";base64"));
              const fileName = `image.${mimeType.split('/')[1] || 'bin'}`;
              
              const fileObject = await openai!.files.create({
                  file: new File([imageBuffer], fileName, { type: mimeType }),
                  purpose: 'vision',
              });
              fileId = fileObject.id;
              console.log(`[API Chat Stream] Image uploaded. File ID: ${fileId}`);
          }

          const messageContent: OpenAI.Beta.Threads.Messages.MessageCreateParams.Content[] = [];
          if (typeof message === 'string' && message.trim()) {
              messageContent.push({ type: 'text', text: message });
          }
          if (fileId) {
              messageContent.push({ type: 'image_file', image_file: { file_id: fileId } });
          }
          if (messageContent.length === 0) {
             messageContent.push({type: 'text', text: '(Attempted to send empty message or failed image upload)'});
          }
          
          await openai!.beta.threads.messages.create(currentThreadId, {
            role: 'user',
            content: messageContent,
          });
          console.log(`[API Chat Stream] Message added to thread ${currentThreadId}.`);

          let run = await openai!.beta.threads.runs.stream(currentThreadId, {
            assistant_id: openaiAssistantId,
          });

          for await (const event of run) {
            switch (event.event) {
              case 'thread.run.created':
                console.log(`[API Chat Stream] Run ${event.data.id} created.`);
                sendEvent(controller, { type: 'thread.run.created', data: event.data, threadId: currentThreadId });
                break;
              case 'thread.run.queued':
              case 'thread.run.in_progress':
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                break;
              case 'thread.run.requires_action':
                console.log(`[API Chat Stream] Run ${event.data.id} requires action.`);
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                
                if (event.data.required_action?.type === 'submit_tool_outputs' && 
                    event.data.required_action.submit_tool_outputs?.tool_calls) {
                  
                  const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
                  console.log(`[API Chat Stream] [MCP] ${toolCalls.length} tool call(s) required by OpenAI.`);
                                    
                  const toolOutputs = await handleMCPToolCalls(toolCalls, currentThreadId, controller);
                  
                  console.log(`[API Chat Stream] [MCP] Submitting ${toolOutputs.length} tool output(s) to OpenAI run ${event.data.id}.`);
                  run = openai!.beta.threads.runs.submitToolOutputsStream(
                    currentThreadId,
                    event.data.id, 
                    { tool_outputs: toolOutputs }
                  );
                  console.log(`[API Chat Stream] [MCP] Tool outputs submitted. Continuing stream for run ${event.data.id}.`);
                } else {
                  console.warn(`[API Chat Stream] Unhandled requires_action type: ${event.data.required_action?.type}`);
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
                console.log(`[API Chat Stream] Run ${event.data.id} completed.`);
                sendEvent(controller, { type: 'thread.run.completed', data: event.data, threadId: currentThreadId });
                sendEvent(controller, { type: 'stream.ended' });
                controller.close();
                return; 
              case 'thread.run.failed':
              case 'thread.run.cancelled':
              case 'thread.run.expired':
                console.error(`[API Chat Stream] Run ${event.data.id} failed/cancelled/expired:`, event.data.last_error || event.data);
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                sendEvent(controller, { type: 'stream.ended', error: event.data.last_error?.message || 'Run failed' });
                controller.close();
                return;
              case 'error':
                console.error("[API Chat Stream] Error in OpenAI stream:", event.data);
                sendEvent(controller, { type: 'error', data: { message: 'Error in OpenAI stream', details: event.data } });
                sendEvent(controller, { type: 'stream.ended', error: 'OpenAI stream error' });
                controller.close();
                return;
              default:
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
                break;
            }
          }
          
          console.warn("[API Chat Stream] OpenAI stream finished unexpectedly without a terminal event.");
          sendEvent(controller, { type: 'stream.ended', error: 'Stream ended without completion.'});
          controller.close();

        } catch (error: any) {
          console.error("[API Chat Stream] Error within ReadableStream execution:", error);
          try {
            sendEvent(controller, { type: 'error', data: { message: error.message || 'Internal server error during stream', details: error.toString() } });
            sendEvent(controller, { type: 'stream.ended', error: error.message || 'Stream error'});
          } catch (e) { /* Controller might be already closed or in error state */ }
          if (!controller.desiredSize) { 
            controller.close();
          }
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
    console.error('[API Chat Stream] Unhandled general error in POST /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message || "Unknown error" }, { status: 500 });
  }
}
