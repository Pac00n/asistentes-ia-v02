// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantById } from '@/lib/assistants';
import { Buffer } from 'buffer';

export const runtime = "nodejs";
export const maxDuration = 60; 

// --- Cliente OpenAI (inicialización robusta) ---
let openai: OpenAI | null = null;
const openAIApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (openAIApiKey && openAIApiKey.trim() !== "") {
    try {
        openai = new OpenAI({ apiKey: openAIApiKey });
        console.log("[API Chat Stream] Cliente OpenAI inicializado exitosamente.");
    } catch (e) {
        console.error("[API Chat Stream] Falló la inicialización del cliente OpenAI:", e);
    }
} else {
    console.warn("[API Chat Stream] NEXT_PUBLIC_OPENAI_API_KEY no está configurada. Los asistentes de OpenAI no funcionarán.");
}
// --- Fin Cliente OpenAI ---

// Helper para enviar eventos SSE
function sendEvent(controller: ReadableStreamDefaultController<any>, event: object) {
  controller.enqueue(`data: ${JSON.stringify(event)}

`);
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
              case 'thread.run.requires_action': // Potentially handle tool calls here if needed in future
                sendEvent(controller, { type: event.event, data: event.data, threadId: currentThreadId });
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
