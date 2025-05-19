"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Cpu, Send, ArrowLeft, Loader2, Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
// import SmallRotatingLogo from "../components/SmallRotatingLogo"; // Ya no se usará para el fondo principal

interface ChatMessage {
  role: "user" | "assistant" | "tool";
  content: string | null;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  tool_call_id?: string;
}

export default function MCPChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efecto para el logo giratorio
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      setRotation(scrollY * 0.1);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efecto para hacer scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = { role: "user", content: input };
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
          messages: [...messages, userMessage].filter(msg => msg.role === 'user' || msg.role === 'assistant'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }

      // Procesar stream de respuesta
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se pudo obtener el reader del stream");

      // Las variables assistantMessage y currentToolCall ya no son necesarias aquí
      // Se manejará directamente dentro de las actualizaciones de estado de setMessages

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
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;
                  
                  if (lastMsg && lastMsg.role === 'assistant') {
                    // Anexar al último mensaje del asistente
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      content: (lastMsg.content || "") + data.text
                    };
                  } else {
                    // Iniciar un nuevo mensaje del asistente
                    // Esto ocurrirá si no hay mensajes previos, o si el último mensaje fue del usuario o de una herramienta.
                    newMessages.push({ role: 'assistant', content: data.text });
                  }
                  return newMessages;
                });
              }

              // Procesar llamada a herramienta
              if (data.toolCall) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;

                  if (lastMsg && lastMsg.role === 'assistant') {
                    // Añadir toolCall al último mensaje del asistente
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      toolCall: data.toolCall
                    };
                  } else {
                    // Si no hay un mensaje de asistente previo al que adjuntar la toolCall,
                    // (ej. la toolCall es lo primero que envía el asistente), creamos uno nuevo.
                    newMessages.push({ role: 'assistant', content: "", toolCall: data.toolCall });
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
                  tool_call_id: data.toolResult.toolCallId
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Fondo con efecto de partículas y gradiente */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-transparent"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/90"></div>
        
        {/* Fondo con efecto de rotación (estilo página de inicio) */}
        <div
          className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none"
          style={{ filter: 'blur(24px)', opacity: 0.10 }} // Ajusta el blur y opacidad según prefieras
        >
          <motion.div
            className="w-full h-full flex items-center justify-center"
            style={{ rotate: rotation }} // rotation viene del estado y useEffect que ya tienes
          >
            <Image
              src="/LogosNuevos/logo_orbia_sin_texto.png"
              alt="Orbia Logo Fondo"
              width={700} // Tamaño grande
              height={700}
              className="object-contain opacity-60" // Ajuste de opacidad sin blur
              priority
            />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="pt-6 pb-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/assistants" className="flex items-center group">
              <div className="p-1.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <ArrowLeft className="h-5 w-5 text-purple-400" />
              </div>
              <span className="ml-2 text-sm font-medium text-purple-300 group-hover:text-purple-200 transition-colors">
                Volver a asistentes
              </span>
            </Link>
            <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-700/50">
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-300">MCP Assistant</span>
            </div>
          </div>
        </header>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {messages.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center h-full text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 mb-6">
                <Cpu className="h-12 w-12 text-purple-400 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Asistente MCP</h2>
              <p className="text-gray-400 max-w-md">
                Soy un asistente de IA con capacidades avanzadas. 
                ¿En qué puedo ayudarte hoy?
              </p>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3/4 rounded-2xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                      : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-bl-none text-gray-100'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center ml-2">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Área de entrada */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8 pt-4">
          <form 
            onSubmit={handleSubmit} 
            className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all duration-200"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="w-full bg-transparent border-0 focus:ring-0 text-white placeholder-gray-400 pr-16 py-4 pl-6"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
          
          {error && (
            <motion.div 
              className="mt-3 px-4 py-2 bg-red-900/30 border border-red-800/50 text-red-200 text-sm rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
          
          <p className="mt-3 text-center text-xs text-gray-500">
            MCP puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>
    </div>
  );
}
