"use client";

import { AssistantCard } from "@/components/AssistantCard";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Asistentes IA</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Asistentes existentes */}
        <AssistantCard 
          title="Asistente OpenAI" 
          description="Asistente basado en GPT-4" 
          route="/chat/openai" 
        />
        
        {/* Nuevo Asistente MCP */}
        <AssistantCard 
          title="Asistente MCP" 
          description="Asistente con herramientas externas para búsqueda web, clima, calculadora, divisas y noticias" 
          route="/chat/mcp"
          badge="MCP"
          badgeColor="bg-emerald-500"
          icon="cpu"
        />
        
        {/* Mantener otros asistentes existentes */}
      </div>
    </main>
  );
}
