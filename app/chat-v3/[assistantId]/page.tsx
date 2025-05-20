"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation"; 
import { ArrowLeft, Send, Paperclip, Settings2, Loader2 } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";

// Placeholder types - los ajustaremos cuando conectemos la lógica real.
type AssistantPlaceholder = {
  id: string;
  name: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

export default function ChatV3Page() {
  const params = useParams();
  const router = useRouter(); 
  const assistantId = params.assistantId as string;
  
  const [assistant, setAssistant] = useState<AssistantPlaceholder | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulación de carga de datos del asistente
    const currentAssistantName = 
      assistantId === "mcp-v3" ? "MCP v3 (Nueva UI)" :
      assistantId === "senalizacion-v3" ? "Señalización v3 (Nueva UI)" :
      "Chat v3"; // Default name
    setAssistant({ id: assistantId, name: currentAssistantName });
  }, [assistantId]);

  useEffect(() => {
    if (assistant) {
      setMessages([
        {
          id: "welcome-system",
          role: "system",
          content: `Iniciando chat con ${assistant.name}.`,
          timestamp: new Date(),
        },
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant]); // No necesitamos showWelcomeMessage aquí porque es simple.

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !assistant) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // Simulación de respuesta del asistente
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Respuesta simulada de ${assistant.name} a: "${currentInput}" (Esta es la nueva interfaz de chat V3 con lógica placeholder).`,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 1200);
  };

  const AccentGradient = "bg-gradient-to-r from-orange-500 via-red-500 to-purple-600";
  const SubtleGradient = "bg-gradient-to-r from-orange-400 to-purple-500";

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      <header className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-white/10 bg-gray-950/70 backdrop-blur-md">
        <div className="w-10 h-10"></div> 
        <h1 className={`text-xl font-bold tracking-tight bg-clip-text text-transparent ${SubtleGradient}`}>
          {assistant?.name || "Cargando..."}
        </h1>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full transition-colors"
          aria-label="Configuración"
        >
          <Settings2 size={22} className="text-gray-300" />
        </motion.button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              layout
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
              className={`flex ${ message.role === "system" ? "justify-center" : message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-lg break-words 
                  ${ message.role === "user"
                    ? "bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-br-md"
                    : message.role === "assistant"
                    ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-bl-md"
                    : "bg-gray-700/50 text-gray-400 text-xs italic text-center w-full" 
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                {message.role !== "system" && (
                  <p className="text-xs text-gray-400/80 mt-2 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
             <motion.div layout className="flex justify-start">
                <div className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-bl-md flex items-center`}>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
                    <span className="text-sm">Pensando...</span>
                </div>
            </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="sticky bottom-0 z-20 p-3 md:p-4 border-t border-white/10 bg-gray-950/70 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-2 md:space-x-3">
            <motion.button 
              type="button"
              onClick={() => router.back()} 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(156, 163, 175, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Volver a la página anterior"
            >
              <ArrowLeft size={20} />
            </motion.button>

            <motion.button 
              type="button" 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(251, 146, 60, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-full text-gray-400 hover:text-orange-400 transition-colors"
              aria-label="Adjuntar archivo"
              // disabled={isLoading || (assistant && !assistant.assistant_id)} // Lógica de deshabilitar quitada por ahora
            >
              <Paperclip size={20} />
            </motion.button>
            {/* <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" /> */}
            
            <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2 md:space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 p-3 rounded-xl bg-gray-800/80 border border-white/10 focus:ring-2 focus:ring-orange-500/70 focus:border-orange-500/70 outline-none transition-all placeholder-gray-500 text-sm text-gray-100"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading && input.trim()) {
                    handleSubmit(e as any);
                  }
                }}
              />
              <motion.button 
                type="submit"
                disabled={isLoading || !input.trim()} // Simplificada la condición de disabled
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl text-white disabled:opacity-60 transition-all duration-150 ease-in-out ${AccentGradient} hover:shadow-xl hover:shadow-purple-500/30`}
                aria-label="Enviar mensaje"
              >
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Loader2 size={20} />
                  </motion.div>
                ) : (
                  <Send size={20} />
                )}
              </motion.button>
            </form>
          </div>
          <div className="flex justify-between items-center mt-2.5">
            <p className="text-xs text-gray-600">
              {isLoading ? "Asistente está pensando..." : assistant ? `Chat V3 con ${assistant.name}` : "Conectando..."}
            </p>
            {/* El botón de Nueva Conversación podría requerir lógica más compleja, por ahora se quita si no es esencial para la UI placeholder */}
            {/* <button 
                onClick={startNewConversation} // startNewConversation no está definido en esta versión placeholder
                className="text-xs text-gray-500 hover:text-orange-400 transition-colors flex items-center"
            >
                <RefreshCw size={12} className="mr-1.5"/> Nueva Conversación
            </button> */}
          </div>
        </div>
      </footer>
    </div>
  );
}
