// lib/assistants.ts

import {
  Bot,
  Code,
  Database,
  FileText,
  Image as ImageIcon,
  Paintbrush,
  Calculator,
  FlaskConical, // Asegurar que FlaskConical esté importado
  Globe,
  MessageSquare,
  TrafficCone,
  LucideIcon,
  Wrench,
} from "lucide-react";

// Define la estructura de un asistente
export type Assistant = {
  id: string;
  assistant_id?: string; // ID del Asistente de OpenAI (opcional)
  name: string;
  shortDescription: string;
  description: string;
  iconType: LucideIcon;
  bgColor: string;
  mcpTools?: string[]; // Lista de servidores MCP que este asistente puede utilizar
  chatApiEndpoint?: string; // Endpoint de API específico para este asistente (opcional)
};

// Lista de asistentes disponibles
export const assistants: Assistant[] = [
  {
    id: "gpt-4o-generic-mcp", // ID interno para la UI
    assistant_id: "asst_aB9vQf9JCz7lJL1bzZKcCM1c", // Tu ID real de OpenAI
    name: "Asistente GPT-4o Genérico (MCP)",
    shortDescription: "Asistente GPT-4o con acceso a archivos y memoria vía MCP.",
    description: "Un asistente versátil basado en GPT-4o que puede utilizar el sistema de archivos local y una memoria persistente a través del Model Context Protocol (MCP) para realizar tareas más complejas.",
    iconType: Bot, // Icono genérico de Bot
    bgColor: "bg-purple-600", // Un color distintivo
    mcpTools: ["filesystem", "memory"], // Habilitar filesystem y memory
  },
  {
    id: "dall-e-images",
    assistant_id: "asst_ABC123DEF456GHI789", // Reemplaza con tu ID real
    name: "Generador de Imágenes",
    shortDescription: "Crea imágenes a partir de descripciones (OpenAI).",
    description: "Utiliza DALL·E a través de la API de Asistentes de OpenAI para generar imágenes únicas basadas en tus indicaciones de texto.",
    iconType: ImageIcon,
    bgColor: "bg-indigo-600",
  },
  {
    id: "general-assistant",
    assistant_id: "asst_XYZ987UVW654RST123", // Reemplaza con tu ID real
    name: "Asistente General con MCP",
    shortDescription: "Responde preguntas y realiza tareas, puede usar archivos y memoria (OpenAI + MCP).",
    description: "Un asistente conversacional general potenciado por GPT. Puede responder preguntas, resumir texto, traducir y más. Adicionalmente puede usar herramientas MCP para acceder al sistema de archivos y una memoria persistente.",
    iconType: MessageSquare,
    bgColor: "bg-green-600",
    mcpTools: ["filesystem", "memory"], // Herramientas MCP que puede usar
  },
  {
    id: "asistente-senalizacion",
    assistant_id: "asst_MXuUc0TcV7aPYkLGbN5glitq", // ID real del asistente OpenAI
    name: "Asistente de Señalización",
    shortDescription: "Identifica y explica señales de tráfico (OpenAI).",
    description: "Proporciona información sobre señales de tráfico a partir de imágenes o descripciones. Utiliza un asistente de OpenAI especializado.",
    iconType: TrafficCone,
    bgColor: "bg-yellow-600",
  },
  {
    id: "mcp-developer-assistant",
    // assistant_id: "asst_DEV_TOOL_MCP_EXAMPLE_ID", // Reemplaza con tu ID real cuando lo tengas
    name: "Asistente de Desarrollo (MCP)",
    shortDescription: "Ayuda con tareas de desarrollo usando GitHub y archivos.",
    description: "Un asistente especializado para desarrolladores que puede acceder a repositorios de GitHub y al sistema de archivos local a través de MCP.",
    iconType: Wrench, 
    bgColor: "bg-blue-600",
    mcpTools: ["filesystem", "github"], 
  },
  // Nuevo asistente de prueba
  {
    id: "direct-chat-test",
    name: "Asistente Chat Directo (Prueba)",
    shortDescription: "Prueba de conexión directa a OpenAI y herramientas.",
    description: "Este es un asistente de prueba que se conecta directamente a la API de Chat Completions de OpenAI y puede invocar herramientas definidas en su backend. No utiliza un ID de Asistente de OpenAI predefinido.",
    iconType: FlaskConical,
    bgColor: "bg-yellow-500",
    mcpTools: ["experimental_mcp_tool"], // Descriptivo
    chatApiEndpoint: "/api/chat/direct-chat-test", // Endpoint específico
  },
];

// Función para obtener un asistente por su ID
export const getAssistantById = (id: string): Assistant | undefined => {
  return assistants.find((assistant) => assistant.id === id);
};
