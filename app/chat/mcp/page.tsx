"use client";

import { useState } from "react";
import Link from "next/link";
import { Cpu } from "lucide-react";

export default function MCPChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Limpiar input y establecer estado de carga
    const userInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Llamar al API endpoint
      const response = await fetch("/api/chat/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }

      // Procesar stream de respuesta
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se pudo obtener el reader del stream");

      let assistantMessage = { role: "assistant", content: "" };
      let currentToolCall: any = null;

      // Función para procesar el stream
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decodificar el chunk
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            if (line.includes("[DONE]")) continue;

            try {
              const data = JSON.parse(line.replace("data: ", ""));

              // Procesar texto
              if (data.text) {
                assistantMessage.content += data.text;
                setMessages(prev => {
                  // Reemplazar el último mensaje si es del asistente, o añadir uno nuevo
                  const newMessages = [...prev];
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                    newMessages[newMessages.length - 1] = assistantMessage;
                  } else {
                    newMessages.push(assistantMessage);
                  }
                  return newMessages;
                });
              }

              // Procesar llamada a herramienta
              if (data.toolCall) {
                currentToolCall = data.toolCall;
                assistantMessage.toolCall = currentToolCall;
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                    newMessages[newMessages.length - 1] = assistantMessage;
                  } else {
                    newMessages.push(assistantMessage);
                  }
                  return newMessages;
                });
              }

              // Procesar resultado de herramienta
              if (data.toolResult) {
                // Añadir mensaje de herramienta
                setMessages(prev => [...prev, {
                  role: "tool",
                  content: JSON.stringify(data.toolResult.result, null, 2),
                  toolCallId: data.toolResult.toolCallId
                }]);
              }
            } catch (e) {
              console.error("Error al procesar chunk:", e);
            }
          }
        }
      };

      // Iniciar procesamiento del stream
      await processStream();
    } catch (err) {
      console.error("Error en la solicitud:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          <Cpu className="mr-2 h-6 w-6 text-emerald-500" />
          <span>Asistente MCP</span>
          <span className="ml-2 px-2 py-1 text-xs bg-emerald-500 text-white rounded-full">MCP</span>
        </h1>
        <Link href="/" className="text-blue-500 hover:underline">
          Volver a Inicio
        </Link>
      </div>
      
      <div className="flex-1 border border-emerald-200 rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Cpu className="mx-auto h-12 w-12 mb-4 text-emerald-500" />
                <p>¡Hola! Soy el Asistente MCP. Puedo ayudarte con:</p>
                <ul className="mt-2 list-disc list-inside text-left max-w-md mx-auto">
                  <li>Búsquedas en la web</li>
                  <li>Consultas del clima</li>
                  <li>Cálculos matemáticos</li>
                  <li>Conversión de divisas</li>
                  <li>Titulares de noticias</li>
                </ul>
                <p className="mt-4">¿En qué puedo ayudarte hoy?</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 ml-auto max-w-[80%]"
                      : message.role === "tool"
                      ? "bg-emerald-50 border border-emerald-200 max-w-[80%]"
                      : "bg-gray-100 max-w-[80%]"
                  }`}
                >
                  {/* Contenido del mensaje */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Visualización de herramientas (si hay) */}
                  {message.role === "assistant" && message.toolCall && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                      <p className="text-xs text-emerald-700 font-medium">
                        Usando herramienta: {message.toolCall.name}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Indicador de carga */}
              {isLoading && (
                <div className="p-4 rounded-lg bg-gray-100 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse h-2 w-2 bg-gray-400 rounded-full"></div>
                    <div className="animate-pulse h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
                    <div className="animate-pulse h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
                  </div>
                </div>
              )}
              
              {/* Mensaje de error */}
              {error && (
                <div className="p-4 rounded-lg bg-red-100 text-red-700 max-w-[80%]">
                  Error: {error}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Formulario de entrada */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta algo al asistente MCP..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-emerald-500 text-white rounded-md disabled:bg-emerald-300"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
