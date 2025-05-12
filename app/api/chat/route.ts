import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getAssistantById } from "@/lib/assistants"

// Usar el runtime de Node.js
export const runtime = "nodejs"

// Permitir respuestas de hasta 60 segundos
export const maxDuration = 60

// Helper para esperar a que el run se complete
const waitForRunCompletion = async (
  openai: OpenAI,
  threadId: string,
  runId: string,
  maxAttempts = 30,
): Promise<OpenAI.Beta.Threads.Runs.Run> => {
  let run = await openai.beta.threads.runs.retrieve(threadId, runId)
  let attempts = 0

  while (["queued", "in_progress", "cancelling"].includes(run.status) && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Esperar 1 segundo
    run = await openai.beta.threads.runs.retrieve(threadId, runId)
    console.log(`Estado del run (intento ${++attempts}): ${run.status}`)
  }

  return run
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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API key de OpenAI no configurada" }, { status: 500 })
    }

    // Inicializar el cliente de OpenAI con la opción dangerouslyAllowBrowser
    // Esto es seguro porque estamos en una ruta API del servidor
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })

    // Gestionar el Thread (Hilo)
    let currentThreadId = threadId

    if (!currentThreadId) {
      // Crear un nuevo hilo si no existe
      const thread = await openai.beta.threads.create()
      currentThreadId = thread.id
      console.log(`Nuevo thread creado: ${currentThreadId}`)
    } else {
      console.log(`Usando thread existente: ${currentThreadId}`)
    }

    // Añadir el mensaje del usuario al hilo
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: message,
    })
    console.log(`Mensaje añadido al thread: ${message}`)

    // Crear y ejecutar un Run
    const openaiAssistantId = assistant.openaiAssistantId
    console.log(`Creando Run con Assistant ID: ${openaiAssistantId}`)

    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: openaiAssistantId,
    })
    console.log(`Run creado: ${run.id}`)

    // Esperar la finalización del Run
    const completedRun = await waitForRunCompletion(openai, currentThreadId, run.id)

    // Comprobar el estado final
    if (completedRun.status !== "completed") {
      console.error(`Run no completado. Estado final: ${completedRun.status}`)
      console.error("Detalles del error:", completedRun.last_error)

      if (completedRun.status === "requires_action") {
        return NextResponse.json(
          {
            error: "El asistente requiere acciones adicionales que no están implementadas en esta versión",
          },
          { status: 501 },
        )
      }

      return NextResponse.json(
        {
          error: `Error en la ejecución del asistente: ${completedRun.status}`,
          details: completedRun.last_error,
        },
        { status: 500 },
      )
    }

    // Recuperar la respuesta del asistente
    const threadMessages = await openai.beta.threads.messages.list(currentThreadId, {
      order: "asc", // Ordenar ascendente para facilitar encontrar la última respuesta
    })

    // Verificar que hay mensajes
    if (!threadMessages.data || threadMessages.data.length === 0) {
      console.error("No se encontraron mensajes en el thread")
      return NextResponse.json({ error: "No se encontraron mensajes en la conversación" }, { status: 500 })
    }

    // Encontrar la última respuesta del asistente
    // Filtramos los mensajes que son del asistente y posteriores al inicio del run
    // Añadimos verificaciones para evitar errores de undefined
    const assistantResponses = threadMessages.data.filter((msg) => {
      // Verificar que msg y msg.role existen antes de comparar
      return msg && msg.role === "assistant" && msg.run_id === run.id
    })

    // Verificar que hay respuestas del asistente
    if (!assistantResponses || assistantResponses.length === 0) {
      console.error("No se encontraron respuestas del asistente para este run")
      return NextResponse.json({ error: "El asistente no generó una respuesta" }, { status: 500 })
    }

    // Tomamos el contenido del último mensaje del asistente encontrado
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
