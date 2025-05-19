// Contenido de app/api/chat/direct-chat-test/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = "nodejs"; // O "edge" si no hay dependencias específicas de Node.js pesado
export const maxDuration = 30; // Segundos, ajustar según necesidad

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Obtiene el clima actual para una ubicación específica.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'La ciudad y país, ej: Madrid, España' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Unidad de temperatura' },
        },
        required: ['location'],
      },
    },
  },
];

type ChatCompletionMessageParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const KNOWN_LOCATIONS: Record<string, { name: string; latitude: number; longitude: number; country: string }> = {
  'madrid': { name: 'Madrid', latitude: 40.4168, longitude: -3.7038, country: 'España' },
  'barcelona': { name: 'Barcelona', latitude: 41.3851, longitude: 2.1734, country: 'España' },
  'tokio': { name: 'Tokio', latitude: 35.6762, longitude: 139.6503, country: 'Japón' },
  'new york': { name: 'New York', latitude: 40.7128, longitude: -74.0060, country: 'USA' },
  'london': { name: 'London', latitude: 51.5074, longitude: -0.1278, country: 'UK' },
  'paris': { name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France' },
};

const WEATHER_CODE_MAP: Record<number, string> = {
  0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Niebla',
  48: 'Niebla engelante', 51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
  56: 'Llovizna helada ligera', 57: 'Llovizna helada densa', 61: 'Lluvia ligera', 63: 'Lluvia moderada',
  65: 'Lluvia fuerte', 66: 'Lluvia helada ligera', 67: 'Lluvia helada fuerte', 71: 'Nieve ligera',
  73: 'Nieve moderada', 75: 'Nieve fuerte', 77: 'Granos de nieve', 80: 'Chubascos de lluvia ligeros',
  81: 'Chubascos de lluvia moderados', 82: 'Chubascos de lluvia violentos', 85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve fuertes', 95: 'Tormenta', 96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo intenso',
};

function getCoordinates(location: string): { name: string; latitude: number; longitude: number; country: string } | null {
  const normalizedLocation = location.toLowerCase().trim();
  const exactMatch = KNOWN_LOCATIONS[normalizedLocation];
  if (exactMatch) return exactMatch;
  for (const key in KNOWN_LOCATIONS) {
    if (normalizedLocation.includes(key)) return KNOWN_LOCATIONS[key];
  }
  return null;
}

async function getWeatherFromOpenMeteo(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius') {
  const locationData = getCoordinates(location);
  if (!locationData) throw new Error(`No se encontraron coordenadas para: ${location}.`);
  const { latitude, longitude, name, country } = locationData;
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto&temperature_unit=${unit === 'celsius' ? 'celsius' : 'fahrenheit'}`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`Error API Open-Meteo: ${response.statusText}`);
  const data = await response.json();
  return {
    location: `${name}, ${country}`,
    temperature: `${data.current.temperature_2m}${unit === 'celsius' ? '°C' : '°F'}`,
    condition: WEATHER_CODE_MAP[data.current.weather_code] || 'Desconocido',
    humidity: `${data.current.relative_humidity_2m}%`,
    wind_speed: `${data.current.wind_speed_10m} km/h`,
  };
}

async function getWeather(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius'): Promise<string> {
  try {
    const data = await getWeatherFromOpenMeteo(location, unit);
    return JSON.stringify(data);
  } catch (error: any) {
    console.error("[getWeather Error]", error);
    return JSON.stringify({ error: `No pude obtener el clima para ${location}. ${error?.message}` });
  }
}

export async function POST(req: Request) {
  try {
    // El frontend envía 'message' para el input actual y 'conversationHistory' para los mensajes previos.
    const { message: currentMessageContent, conversationHistory = [] } = await req.json();

    if (!currentMessageContent?.trim()) {
        return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    const messagesForOpenAI: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'Eres un asistente útil. Cuando uses herramientas, incluye toda la información relevante de la respuesta de la herramienta en tu respuesta al usuario de forma conversacional. Si una herramienta devuelve un error, informa al usuario amablemente.' },
      ...conversationHistory.map((msg: any) => ({ role: msg.role, content: msg.content })).filter((msg: any) => msg.content?.trim()), // Historial previo
      { role: 'user', content: currentMessageContent }, // Mensaje actual del usuario
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesForOpenAI,
      tools: tools,
      tool_choice: 'auto',
    });

    let responseMessage = completion.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messagesForOpenAI.push(responseMessage); // Add assistant's message with tool_calls

      const availableFunctions: { [key: string]: Function } = {
        get_weather: getWeather,
      };

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        let functionResponseContent = "";

        try {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          console.log(`[Tool Call] Calling: ${functionName} with args:`, functionArgs);
          functionResponseContent = await functionToCall(functionArgs.location, functionArgs.unit);
          console.log(`[Tool Call] Response from ${functionName}:`, functionResponseContent);
        } catch (error: any) {
          console.error(`[Tool Call Error] Error executing ${functionName}:`, error);
          functionResponseContent = JSON.stringify({ error: `Error ejecutando ${functionName}: ${error.message || 'Error desconocido'}` });
        }
        
        messagesForOpenAI.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: functionResponseContent,
        });
      }

      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messagesForOpenAI,
      });
      responseMessage = secondResponse.choices[0].message;
    }
    
    return NextResponse.json({ message: responseMessage });

  } catch (error: unknown) {
    console.error("[API POST Error]", error);
    let statusCode = 500;
    let errorMessage = 'Error al procesar la solicitud en el servidor.';
    let errorDetails = error instanceof Error ? error.message : String(error);

    if (error instanceof SyntaxError) { 
        statusCode = 400; 
        errorMessage = 'Error de formato en la solicitud.'; 
    } else if (error instanceof OpenAI.APIError) {
        statusCode = error.status || 500;
        errorMessage = error.name ? `Error de OpenAI: ${error.name}` : 'Error de OpenAI.';
        errorDetails = error.message;
    }
    
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
  }
}
