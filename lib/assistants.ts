// Eliminamos la importación de ReactNode ya que ya no la necesitamos

export type Assistant = {
  id: string
  openaiAssistantId: string
  name: string
  shortDescription: string
  description: string
  iconType: string  // Usamos string para identificar el tipo de icono
  bgColor: string
  category: string
  badgeVariant: "default" | "secondary" | "outline" | "destructive"
  tags: string[]
  messageCount: number
}

// Definimos los asistentes con strings para los iconos
export const assistants: Assistant[] = [
  {
    id: "road_marking_specialist",
    openaiAssistantId: "asst_MXuUc0TcV7aPYkLGbN5glitq", // ID real proporcionado
    name: "Especialista en Señalización Horizontal",
    shortDescription: "Experto en normativas y técnicas de señalización vial",
    description:
      "Asistente especializado en señalización horizontal de carreteras. Proporciona información sobre normativas, materiales, técnicas de aplicación, mantenimiento y soluciones para proyectos viales.",
    iconType: "road",
    bgColor: "bg-amber-600",
    category: "Infraestructura",
    badgeVariant: "secondary",
    tags: ["Carreteras", "Normativas", "Señalización", "Seguridad Vial"],
    messageCount: 542,
  },
  {
    id: "marketing_copywriter",
    openaiAssistantId: "asst_abc123", // Reemplazar con tu ID real de OpenAI
    name: "Copywriter de Marketing",
    shortDescription: "Crea contenido persuasivo para tus campañas",
    description:
      "Especializado en redacción persuasiva para emails, anuncios, landing pages y más. Optimiza tus conversiones con copy que convierte.",
    iconType: "pen-tool",
    bgColor: "bg-pink-600",
    category: "Marketing",
    badgeVariant: "default",
    tags: ["Email Marketing", "Anuncios", "Landing Pages", "SEO"],
    messageCount: 1243,
  },
  {
    id: "data_analyst",
    openaiAssistantId: "asst_def456", // Reemplazar con tu ID real de OpenAI
    name: "Analista de Datos",
    shortDescription: "Interpreta tus datos y obtén insights",
    description:
      "Te ayuda a interpretar datos, crear visualizaciones y obtener insights accionables para tu negocio o proyecto.",
    iconType: "trending-up",
    bgColor: "bg-blue-600",
    category: "Análisis",
    badgeVariant: "secondary",
    tags: ["Estadísticas", "Visualización", "Insights", "Reportes"],
    messageCount: 856,
  },
  {
    id: "code_assistant",
    openaiAssistantId: "asst_ghi789", // Reemplazar con tu ID real de OpenAI
    name: "Asistente de Código",
    shortDescription: "Ayuda con programación y debugging",
    description:
      "Resuelve problemas de código, explica conceptos de programación y te ayuda a implementar nuevas funcionalidades en tu proyecto.",
    iconType: "code",
    bgColor: "bg-emerald-600",
    category: "Desarrollo",
    badgeVariant: "outline",
    tags: ["JavaScript", "Python", "React", "Node.js"],
    messageCount: 2105,
  },
  {
    id: "content_writer",
    openaiAssistantId: "asst_jkl012", // Reemplazar con tu ID real de OpenAI
    name: "Escritor de Contenido",
    shortDescription: "Crea artículos, blogs y contenido web",
    description:
      "Genera contenido de calidad para tu blog, redes sociales o sitio web. Optimizado para SEO y engagement con tu audiencia.",
    iconType: "file-text",
    bgColor: "bg-orange-600",
    category: "Contenido",
    badgeVariant: "default",
    tags: ["Blog", "SEO", "Redes Sociales", "Artículos"],
    messageCount: 1567,
  },
  {
    id: "productivity_coach",
    openaiAssistantId: "asst_mno345", // Reemplazar con tu ID real de OpenAI
    name: "Coach de Productividad",
    shortDescription: "Mejora tu eficiencia y organización",
    description:
      "Te ayuda a establecer metas, crear hábitos productivos y optimizar tu tiempo para lograr más con menos estrés.",
    iconType: "brain",
    bgColor: "bg-purple-600",
    category: "Productividad",
    badgeVariant: "secondary",
    tags: ["GTD", "Hábitos", "Organización", "Metas"],
    messageCount: 943,
  },
  {
    id: "customer_support",
    openaiAssistantId: "asst_pqr678", // Reemplazar con tu ID real de OpenAI
    name: "Soporte al Cliente",
    shortDescription: "Responde preguntas frecuentes de clientes",
    description:
      "Automatiza respuestas a preguntas frecuentes de tus clientes, gestiona consultas básicas y escala problemas complejos.",
    iconType: "message-square",
    bgColor: "bg-yellow-600",
    category: "Soporte",
    badgeVariant: "outline",
    tags: ["FAQ", "Tickets", "Onboarding", "Resolución"],
    messageCount: 3241,
  },
]

// Función para obtener un asistente por su ID
export function getAssistantById(id: string): Assistant | undefined {
  return assistants.find((assistant) => assistant.id === id)
}
