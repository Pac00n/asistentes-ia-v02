import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getAssistantById } from "@/lib/assistants"

// Usar el runtime de Node.js en lugar de Edge si hay problemas con Edge
export const runtime = "nodejs"

// Permitir respuestas de hasta 60 segundos
export const maxDuration = 60

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

    // Inicializar el cliente de OpenAI
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      return NextResponse.json({ error: "API key de OpenAI no configurada" }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
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
    // Usamos el ID real del asistente de OpenAI
    const openaiAssistantId = assistant.openaiAssistantId

    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: openaiAssistantId,
    })
    console.log(`Run creado: ${run.id}`)

    // Esperar la finalización del Run (Polling)
    let currentRun = run
    let attempts = 0
    const maxAttempts = 30 // Máximo 30 intentos (30 segundos con 1 segundo de espera)

    while (["queued", "in_progress", "cancelling"].includes(currentRun.status) && attempts < maxAttempts) {
      // Esperar 1 segundo entre cada consulta
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++

      // Obtener el estado actual del run
      currentRun = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      console.log(`Estado del run (intento ${attempts}): ${currentRun.status}`)
    }

    // Comprobar el estado final
    if (currentRun.status !== "completed") {
      console.error(`Run no completado. Estado final: ${currentRun.status}`)

      // Si el estado es 'requires_action', podríamos manejar function calling aquí
      if (currentRun.status === "requires_action") {
        return NextResponse.json(
          {
            error: "El asistente requiere acciones adicionales que no están implementadas en esta versión",
          },
          { status: 501 },
        )
      }

      return NextResponse.json(
        {
          error: `Error en la ejecución del asistente: ${currentRun.status}`,
        },
        { status: 500 },
      )
    }

    // Recuperar la respuesta del asistente
    const messages = await openai.beta.threads.messages.list(currentThreadId, {
      order: "desc", // Más recientes primero
      limit: 1, // Solo necesitamos el último mensaje (la respuesta)
    })

    // Verificar que hay mensajes y que el último es del asistente
    if (messages.data.length === 0 || messages.data[0].role !== "assistant") {
      console.error("No se encontró respuesta del asistente")
      return NextResponse.json({ error: "No se pudo obtener una respuesta del asistente" }, { status: 500 })
    }

    // Extraer el contenido del mensaje
    let assistantResponseContent = ""

    // Procesar el contenido que puede tener diferentes formatos
    for (const contentPart of messages.data[0].content) {
      if (contentPart.type === "text") {
        assistantResponseContent += contentPart.text.value
      }
      // Aquí podríamos manejar otros tipos de contenido como imágenes si fuera necesario
    }

    // Enviar la respuesta al frontend
    return NextResponse.json({
      reply: assistantResponseContent,
      threadId: currentThreadId,
    })
  } catch (error) {
    console.error("Error en la API de chat:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
