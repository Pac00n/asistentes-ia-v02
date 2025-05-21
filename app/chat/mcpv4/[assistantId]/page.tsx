"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Send, Paperclip, Settings2, Loader2, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageBase64?: string | null;
  timestamp: Date;
  isStreaming?: boolean;
};

// Helper function to format assistant messages (quita citaciones como 【1†source】)
const formatAssistantMessage = (content: string): string => {
  const citationRegex = /\【.*?\】/g;
  return content.replace(citationRegex, "").trim();
};

export default function ChatV3Page() {
  const params = useParams();
  const router = useRouter(); 
  const assistantId = params.assistantId as string;
  
  const [assistant, setAssistant] = useState({ id: assistantId, name: "" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  const showWelcomeMessage = useCallback(() => {
    const currentAssistantName = 
      assistantId === "mcp-v3" ? "MCP v3" :
      assistantId === "senalizacion-v3" ? "Asistente de Señalización" :
      "Asistente";
    
    setAssistant({ id: assistantId, name: currentAssistantName });
    
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `¡Hola! Soy el ${currentAssistantName}. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
      isStreaming: false
    }]);
  }, [assistantId]);

  // Cargar conversación existente
  useEffect(() => {
    try {
      const storedThreadId = localStorage.getItem(`threadId_${assistantId}`);
      if (storedThreadId) {
        setCurrentThreadId(storedThreadId);
        const storedMessages = localStorage.getItem(`messages_${assistantId}`);
        if (storedMessages) {
          try {
            const parsedMessages = JSON.parse(storedMessages);
            const messagesWithDates = parsedMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              isStreaming: false
            }));
            setMessages(messagesWithDates);
            return; // No mostrar mensaje de bienvenida si hay mensajes guardados
          } catch (e) {
            console.error("Error al cargar mensajes:", e);
          }
        }
      }
      // Mostrar mensaje de bienvenida solo si no hay mensajes guardados
      showWelcomeMessage();
    } catch (e) {
      console.error("Error al cargar la conversación:", e);
      showWelcomeMessage();
    }
  }, [assistantId, showWelcomeMessage]);

  // Guardar mensajes cuando cambian
  useEffect(() => {
    if (messages.length > 0 && !messages.some(m => m.isStreaming) && messages[0]?.id !== 'welcome') {
      try {
        localStorage.setItem(`messages_${assistantId}`, JSON.stringify(messages));
      } catch (e) {
        console.error("Error al guardar mensajes:", e);
      }
    }
  }, [messages, assistantId]);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = "";
  };

  const clearImage = () => {
    setImageBase64(null);
  };

  const startNewConversation = () => {
    if (confirm("¿Estás seguro de que quieres comenzar una nueva conversación? Se perderá el historial actual.")) {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
        streamControllerRef.current = null;
      }
      try {
        localStorage.removeItem(`threadId_${assistantId}`);
        localStorage.removeItem(`messages_${assistantId}`);
        setCurrentThreadId(null);
        setMessages([]);
        showWelcomeMessage();
      } catch (e) {
        console.error("Error al reiniciar la conversación:", e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imageBase64) || isLoading) return;
    
    setError(null);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      imageBase64,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImageBase64 = imageBase64;
    setInput("");
    setImageBase64(null);
    setIsLoading(true);

    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
    }
    
    streamControllerRef.current = new AbortController();
    const signal = streamControllerRef.current.signal;

    let assistantMessagePlaceholderId: string | null = null;
    let accumulatedContent = "";

    try {
      const apiUrl = '/api/chat/mcpv4'; // Changed for mcpv4
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // For mcpv4, we'll send the messages structure similar to how mcp-v3 did
          messages: [
            ...(currentThreadId ? [] : [{ role: 'system', content: 'Eres un asistente útil que puede usar herramientas. Responde en español.' }]),
            ...messages
              .filter(m => m.role !== 'system')
              .map(m => ({
                role: m.role,
                content: m.content,
                ...(m.imageBase64 && { imageBase64: m.imageBase64 })
              })),
            { role: 'user', content: currentInput, ...(currentImageBase64 && { imageBase64: currentImageBase64 }) }
          ]
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No se pudo obtener la respuesta del servidor");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      assistantMessagePlaceholderId = `assistant-stream-${Date.now()}`;
      
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessagePlaceholderId!,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        let eolIndex;
        
        while ((eolIndex = buffer.indexOf('\n\n')) !== -1) {
          const line = buffer.substring(0, eolIndex).trim();
          buffer = buffer.substring(eolIndex + 2);

          if (line.startsWith("data:")) {
            const jsonData = line.substring(5).trim();
            if (jsonData === '[DONE]') {
              setIsLoading(false);
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMessagePlaceholderId
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              return;
            }

            try {
              const event = JSON.parse(jsonData);
              
              // Manejar respuestas de MCP (similar to isMcp block before, now default for mcpv4)
              console.log('Evento MCPv4 recibido:', event);
              
              if (event.text) {
                // Acumular el texto recibido
                accumulatedContent = (accumulatedContent || '') + event.text;
                console.log('Contenido acumulado:', accumulatedContent);
                
                setMessages(prev => {
                  const updated = prev.map(msg => {
                    if (msg.id === assistantMessagePlaceholderId) {
                      return { 
                        ...msg, 
                        content: accumulatedContent, 
                        isStreaming: true 
                      };
                    }
                    return msg;
                  });
                  
                  // Si no existe el mensaje, lo creamos
                  if (!updated.some(m => m.id === assistantMessagePlaceholderId)) {
                    updated.push({
                      id: assistantMessagePlaceholderId!,
                      role: 'assistant',
                      content: accumulatedContent,
                      timestamp: new Date(),
                      isStreaming: true
                    });
                  }
                  
                  return updated;
                });
              } 
              else if (event.toolCall) {
                // Mostrar llamadas a herramientas
                const toolCall = event.toolCall;
                console.log('Llamada a herramienta:', toolCall);
                
                // Mostrar la llamada a herramienta en la interfaz
                const toolCallContent = `Llamando a herramienta: ${toolCall.name}(${toolCall.arguments})`;
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  
                  // Actualizar el mensaje actual si existe
                  const existingMsgIndex = newMessages.findIndex(m => m.id === assistantMessagePlaceholderId);
                  
                  if (existingMsgIndex >= 0) {
                    newMessages[existingMsgIndex] = {
                      ...newMessages[existingMsgIndex],
                      content: accumulatedContent || '', // Preserve already streamed text
                      isStreaming: true
                    };
                  } else if (assistantMessagePlaceholderId) { 
                    // If placeholder was set but message not yet in array, create it
                     newMessages.push({
                        id: assistantMessagePlaceholderId,
                        role: 'assistant',
                        content: accumulatedContent || '',
                        timestamp: new Date(),
                        isStreaming: true
                      });
                  }
                  
                  // Agregar mensaje de sistema para la herramienta
                  newMessages.push({
                    id: `tool-${Date.now()}`,
                    role: 'system',
                    content: toolCallContent,
                    timestamp: new Date()
                  });
                  
                  return newMessages;
                });
              } 
              else if (event.toolResult) {
                console.log('Resultado de herramienta:', event.toolResult);
                
                // Agregar el resultado de la herramienta al mensaje
                const resultContent = `Resultado de ${event.toolResult.toolName || 'herramienta'}: ${JSON.stringify(event.toolResult.result || event.toolResult.error || event.toolResult)}`;
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  
                  const existingMsgIndex = newMessages.findIndex(m => m.id === assistantMessagePlaceholderId);
                  if (existingMsgIndex >= 0) {
                    newMessages[existingMsgIndex] = {
                      ...newMessages[existingMsgIndex],
                      content: accumulatedContent || '', // Preserve already streamed text
                      isStreaming: true 
                    };
                  } else if (assistantMessagePlaceholderId) {
                     newMessages.push({
                        id: assistantMessagePlaceholderId,
                        role: 'assistant',
                        content: accumulatedContent || '',
                        timestamp: new Date(),
                        isStreaming: true
                      });
                  }
                  
                  // Agregar mensaje de sistema para el resultado
                  newMessages.push({
                    id: `tool-result-${Date.now()}`,
                    role: 'system',
                    content: resultContent,
                    timestamp: new Date()
                  });
                  
                  return newMessages;
                });
              }
              
              // Forzar re-renderizado del contenedor de mensajes
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              continue; // Continue to next event after handling MCP specific events

              // The OpenAI Assistants specific logic below is now effectively removed 
              // by hardcoding apiUrl and the request body structure, and by the continue statement.
              // If this page were to handle both, more complex conditional logic would be needed here.

              // Manejar respuestas de OpenAI Assistants (This part is effectively bypassed for mcpv4)
              /*
              if (event.threadId && event.threadId !== currentThreadId) {
                setCurrentThreadId(event.threadId);
                localStorage.setItem(`threadId_${assistantId}`, event.threadId);
              }
              
              if (event.type === 'thread.info' && event.threadId && !currentThreadId) {
                setCurrentThreadId(event.threadId);
                localStorage.setItem(`threadId_${assistantId}`, event.threadId);
              }

              switch (event.type) {
                case 'thread.message.delta':
                  if (event.data.delta.content && event.data.delta.content[0]?.type === 'text') {
                    accumulatedContent += event.data.delta.content[0].text.value;
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessagePlaceholderId 
                        ? { ...msg, content: formatAssistantMessage(accumulatedContent), isStreaming: true } 
                        : msg
                    ));
                  }
                  break;
                case 'thread.message.completed':
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessagePlaceholderId 
                      ? { ...msg, content: formatAssistantMessage(accumulatedContent), isStreaming: false, id: event.data.id } 
                      : msg
                  ));
                  assistantMessagePlaceholderId = null;
                  accumulatedContent = "";
                  break;
                case 'thread.run.completed':
                  setIsLoading(false);
                  setMessages(prev => prev.map(msg =>
                    (msg.role === 'assistant' && msg.isStreaming)
                      ? { ...msg, isStreaming: false }
                      : msg
                  ));
                  break;
                case 'thread.run.failed':
                case 'thread.run.cancelled':
                case 'thread.run.expired':
                  setError(event.data.last_error?.message || `Error: ${event.type}`);
                  setIsLoading(false);
                  if (assistantMessagePlaceholderId) {
                    setMessages(prev => prev.filter(msg => msg.id !== assistantMessagePlaceholderId));
                  }
                  break;
                case 'error':
                  setError(event.data?.details || event.data?.message || event.message || "Error en la conexión");
                  setIsLoading(false);
                  if (assistantMessagePlaceholderId) {
                    setMessages(prev => prev.filter(msg => msg.id !== assistantMessagePlaceholderId));
                  }
                  break;
                case 'stream.ended':
                  setIsLoading(false);
                  setMessages(prev => prev.map(msg =>
                    (msg.role === 'assistant' && msg.isStreaming)
                      ? { ...msg, isStreaming: false }
                      : msg
                  ));
                  if (event.error) {
                    setError(prevError => prevError || event.error);
                  }
                  return;
              }
            } catch (e) {
              console.error("Error procesando el stream:", e, jsonData);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || "Error al enviar el mensaje");
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        setInput(currentInput);
        setImageBase64(currentImageBase64);
      }
      if (assistantMessagePlaceholderId) {
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessagePlaceholderId));
      }
    } finally {
      if (!signal.aborted || messages.every(msg => !msg.isStreaming)) {
        setIsLoading(false);
      }
      streamControllerRef.current = null;
    }
  };

  const AccentGradient = "bg-gradient-to-r from-orange-500 via-red-500 to-purple-600";
  const SubtleGradient = "bg-gradient-to-r from-orange-400 to-purple-500";

  // Efecto para la rotación continua del logo de fondo
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = 0;
    const rotationSpeed = 0.1; // Ajusta la velocidad de rotación según sea necesario

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Actualizar la rotación basada en el tiempo transcurrido
      setRotation(prev => (prev + rotationSpeed * (deltaTime / 16)) % 360);
      
      // Continuar la animación
      animationFrameId = requestAnimationFrame(animate);
    };

    // Iniciar la animación
    animationFrameId = requestAnimationFrame(animate);

    // Limpiar al desmontar
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-white bg-gray-950">
      {/* Fondo con gradiente y logo */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-transparent"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/10"></div>
        <div
          className="fixed inset-0 flex justify-center items-center z-0 pointer-events-none"
          style={{ filter: 'blur(12px)', opacity: 0.3 }}
        >
          <motion.div
            className="w-full h-full flex items-center justify-center"
            style={{ rotate: rotation }}
          >
            <Image
              src="/LogosNuevos/logo_orbia_sin_texto.png"
              alt="Orbia Logo Fondo"
              width={700} 
              height={700}
              className="object-contain opacity-90"
              priority
            />
          </motion.div>
        </div>
      </div>
      <header className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/40 backdrop-blur-md">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="p-2 rounded-full transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} className="text-gray-300" />
        </motion.button>
        <h1 className={`text-xl font-bold tracking-tight bg-clip-text text-transparent ${SubtleGradient}`}>
          {assistant?.name || "Cargando..."}
        </h1>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={startNewConversation}
          className="p-2 rounded-full transition-colors text-sm text-gray-400 hover:text-white"
          aria-label="Nueva conversación"
          title="Nueva conversación"
        >
          <RefreshCw size={18} />
        </motion.button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scroll-smooth bg-transparent">
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
                  ${message.role === "user"
                    ? "bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-br-md"
                    : message.role === "assistant"
                    ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-bl-md"
                    : "bg-gray-700/50 text-gray-400 text-xs italic text-center w-full"
                  }`}
              >
                {message.imageBase64 && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    <img 
                      src={message.imageBase64} 
                      alt="Imagen adjunta" 
                      className="max-w-full h-auto max-h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.role === "assistant" && message.isStreaming && !message.content ? (
                    <div className="flex space-x-1 py-1">
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <div style={{ 
                      color: 'rgb(255, 255, 255)', 
                      opacity: 1,
                      WebkitTextFillColor: 'rgb(255, 255, 255)',
                      WebkitTextStrokeWidth: '0.2px',
                      WebkitTextStrokeColor: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {message.role === "assistant" ? formatAssistantMessage(message.content) : message.content}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2">
                  {message.role === "assistant" && message.isStreaming && (
                    <div className="text-xs text-white">
                      Escribiendo...
                    </div>
                  )}
                  <span className="text-xs ml-auto" style={{ color: 'rgb(255, 255, 255)' }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2"
          >
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-white/80 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="mt-auto z-20 p-3 md:p-4 border-t border-white/10 bg-gray-900/40 backdrop-blur-md">
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
              className="p-2.5 rounded-full text-gray-400 hover:text-orange-400 transition-colors relative"
              aria-label="Adjuntar archivo"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip size={20} />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
                disabled={isLoading}
              />
            </motion.button>
            {imageBase64 && (
              <div className="relative">
                <img 
                  src={imageBase64} 
                  alt="Vista previa" 
                  className="h-10 w-10 rounded-md object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  aria-label="Eliminar imagen"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2 md:space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 p-3 rounded-xl bg-gray-900/90 border border-gray-800 focus:ring-2 focus:ring-orange-500/70 focus:border-orange-500/70 outline-none transition-all placeholder-gray-500 text-sm text-gray-100"
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
