"use strict";
// lib/assistants.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssistantById = exports.assistants = void 0;
const lucide_react_1 = require("lucide-react");
// Lista de asistentes disponibles
exports.assistants = [
    {
        id: "dall-e-images",
        assistant_id: "asst_ABC123DEF456GHI789", // Reemplaza con tu ID real
        name: "Generador de Imágenes",
        shortDescription: "Crea imágenes a partir de descripciones (OpenAI).",
        description: "Utiliza DALL·E a través de la API de Asistentes de OpenAI para generar imágenes únicas basadas en tus indicaciones de texto.",
        iconType: lucide_react_1.Image,
        bgColor: "bg-indigo-600",
    },
    {
        id: "general-assistant",
        assistant_id: "asst_XYZ987UVW654RST123", // Reemplaza con tu ID real
        name: "Asistente General",
        shortDescription: "Responde preguntas y realiza tareas (OpenAI).",
        description: "Un asistente conversacional general potenciado por GPT a través de la API de Asistentes. Puede responder preguntas, resumir texto, traducir y más.",
        iconType: lucide_react_1.MessageSquare,
        bgColor: "bg-green-600",
    },
    {
        id: "asistente-senalizacion",
        assistant_id: "asst_MXuUc0TcV7aPYkLGbN5glitq",
        name: "Asistente de Señalización",
        shortDescription: "Identifica y explica señales de tráfico (OpenAI).",
        description: "Proporciona información sobre señales de tráfico a partir de imágenes o descripciones. Utiliza un asistente de OpenAI especializado.",
        iconType: lucide_react_1.TrafficCone,
        bgColor: "bg-yellow-600",
    },
    {
        id: "mcp",
        name: "Asistente MCP",
        shortDescription: "Asistente personalizado con capacidades avanzadas de procesamiento.",
        description: "Asistente personalizado con capacidades avanzadas de procesamiento y herramientas especializadas para tareas específicas.",
        iconType: lucide_react_1.Cpu,
        bgColor: "bg-purple-600",
    },
    // --- Nuevos Asistentes V3 ---
    {
        id: "senalizacion-v3",
        assistant_id: "asst_MXuUc0TcV7aPYkLGbN5glitq", // Misma funcionalidad que el original
        name: "Señalización v3",
        shortDescription: "Señales de tráfico con la nueva interfaz de chat.",
        description: "Identifica y explica señales de tráfico utilizando el asistente de OpenAI, presentado en la nueva interfaz de chat V3.",
        iconType: lucide_react_1.Palette, // Nuevo ícono para distinguirlo
        bgColor: "bg-orange-600", // Nuevo color para la tarjeta
    },
    {
        id: "mcp-v3",
        name: "MCP v3",
        shortDescription: "Asistente MCP con la nueva interfaz de chat.",
        description: "Interactúa con el Asistente MCP (herramientas locales) utilizando la nueva interfaz de chat V3.",
        iconType: lucide_react_1.Zap, // Nuevo ícono para distinguirlo
        bgColor: "bg-rose-600", // Nuevo color para la tarjeta
        // No assistant_id de OpenAI aquí
    },
];
// Función para obtener un asistente por su ID
const getAssistantById = (id) => {
    return exports.assistants.find((assistant) => assistant.id === id);
};
exports.getAssistantById = getAssistantById;
