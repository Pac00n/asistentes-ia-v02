"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getAssistantById } from "@/lib/assistants"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const params = useParams()
  const assistantId = params.assistantId as string
  const assistant = getAssistantById(assistantId)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useDirectApi, setUseDirectApi] = useState(false) // Para alternar entre implementaciones
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar threadId del localStorage al iniciar
  useEffect(() => {
    try {
      const storedThreadId = localStorage.getItem(`threadId_${assistantId}`)
      if (storedThreadId) {
        setThreadId(storedThreadId)

        // Cargar mensajes anteriores si existen
        const storedMessages = localStorage.getItem(`messages_${assistantId}`)
        if (storedMessages) {
          try {
            const parsedMessages = JSON.parse(storedMessages)
            // Convertir las cadenas de fecha a objetos Date
            const messagesWithDates = parsedMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
            setMessages(messagesWithDates)
          } catch (e) {
            console.error("Error al cargar mensajes anteriores:", e)
            // Si hay error al cargar mensajes, mostrar mensaje de bienvenida
            showWelcomeMessage()
          }
        } else {
          // No hay mensajes guardados, mostrar mensaje de bienvenida
          showWelcomeMessage()
        }
      } else {
        // No hay threadId guardado, mostrar mensaje de bienvenida
        showWelcomeMessage()
      }
    } catch (e) {
      console.error("Error al inicializar el chat:", e)
      showWelcomeMessage()
    }
  }, [assistantId])

  // Función para mostrar el mensaje de bienvenida
  const showWelcomeMessage = () => {
    if (assistant) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `¡Hola! Soy ${assistant.name}. ¿En qué puedo ayudarte hoy?`,
          timestamp: new Date(),
        },
      ])
    }
  }

  // Guardar mensajes en localStorage cuando cambian
  useEffect(() => {
    if (messages.length > 0 && threadId) {
      try {
        localStorage.setItem(`messages_${assistantId}`, JSON.stringify(messages))
      } catch (e) {
        console.error("Error al guardar mensajes en localStorage:", e)
      }
    }
  }, [messages, assistantId, threadId])

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Limpiar error anterior si existe
    setError(null)

    // Agregar mensaje del usuario al chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Determinar qué endpoint usar
      const endpoint = useDirectApi ? "/api/chat-direct" : "/api/chat"

      // Llamar a la API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId,
          message: input,
          threadId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error del servidor:", data.error, data.details)

        // Si el error es con la primera implementación, intentar con la segunda
        if (!useDirectApi && data.error) {
          setUseDirectApi(true)
          throw new Error(`${data.error}. Intentando con implementación alternativa...`)
        }

        throw new Error(data.error || "Error en la respuesta del servidor")
      }

      // Guardar threadId si es nuevo
      if (data.threadId && !threadId) {
        setThreadId(data.threadId)
        try {
          localStorage.setItem(`threadId_${assistantId}`, data.threadId)
        } catch (e) {
          console.error("Error al guardar threadId en localStorage:", e)
        }
      }

      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error("Error en la conversación:", error);

      // Mostrar mensaje de error
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "assistant",
          content: `Lo siento, ha ocurrido un error al procesar tu mensaje: ${error.message}. Por favor, intenta de nuevo.`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Formatear la hora del mensaje
  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (e) {
      console.error("Error al formatear la hora:", e)
      return ""
    }
  }

  const startNewConversation = () => {
    try {
      // Eliminar el threadId del localStorage
      localStorage.removeItem(`threadId_${assistantId}`)
      localStorage.removeItem(`messages_${assistantId}`)
    } catch (e) {
      console.error("Error al eliminar datos de localStorage:", e)
    }

    // Resetear el estado
    setThreadId(null)
    setError(null)
    setUseDirectApi(false)

    // Reiniciar los mensajes con solo el mensaje de bienvenida
    showWelcomeMessage()
  }

  if (!assistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Asistente no encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>El asistente que buscas no existe o no está disponible.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/assistants">Ver todos los asistentes</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 bg-gradient-to-r from-blue-50/90 to-white/90 backdrop-blur-sm border-b border-gray-200/60 transition-all duration-200">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
          <span className="text-lg font-medium text-gray-800">Volver</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={startNewConversation}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Nueva conversación
          </Button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error: {error}. Por favor, intenta de nuevo o contacta con soporte si el problema persiste.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {message.role === "user" ? (
                    <div className="h-8 w-8 ml-3 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full">
                      U
                    </div>
                  ) : (
                    <div className={`h-8 w-8 mr-3 ${assistant.bgColor} flex items-center justify-center rounded-full`}>
                      {assistant.name.charAt(0)}
                    </div>
                  )}
                  <div 
                    className={`rounded-lg p-4 shadow-sm transition-all relative ${message.role === "user" 
                      ? "bg-blue-600 text-white" 
                      : "bg-white border border-gray-200 shadow-sm"} ${message.id === "welcome" ? "ring-1 ring-blue-300 animate-pulse" : ""}`}
                  >
                    {message.id === "welcome" && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-500 animate-ping"></div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className={`h-8 w-8 mr-3 ${assistant.bgColor} flex items-center justify-center rounded-full`}>
                    {assistant.name.charAt(0)}
                  </div>
                  <div className="rounded-lg p-3 bg-white border border-gray-200 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t p-4 sm:p-6 sticky bottom-0 transition-all duration-200 ease-in-out">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 rounded-lg shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 text-xs text-gray-500 text-center">
            {isLoading ? 'Procesando tu mensaje...' : 'Tus conversaciones se guardan para mejorar la experiencia.'}
          </div>
        </div>
      </div>
    </div>
  )
}
