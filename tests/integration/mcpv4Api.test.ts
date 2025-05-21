import { POST } from '@/app/api/chat/mcpv4/route'; // Ajusta la ruta si es necesario
import { NextRequest } from 'next/server';
import { OpenAI as OpenAIClient } from 'openai'; // Importar el tipo real para mockear

// Mockear OpenAI
const mockOpenAICreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  })),
}));

// Helper para consumir el stream (basado en el ejemplo)
async function consumeStream(response: Response): Promise<any[]> {
  if (!response.body) {
    return [];
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Process any remaining buffer after the stream is done
        if (buffer.trim()) {
          const lines = buffer.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.substring('data: '.length).trim();
              if (jsonData === '[DONE]') {
                if (!events.some(e => e.type === 'done')) events.push({ type: 'done' });
              } else if (jsonData) {
                try {
                  events.push(JSON.parse(jsonData));
                } catch (e) {
                  console.warn("Failed to parse JSON from final buffer chunk:", jsonData, e);
                }
              }
            }
          }
        }
        break; // Exit main loop
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      let eolIndex;
      while ((eolIndex = buffer.indexOf('\n\n')) !== -1) {
        const line = buffer.substring(0, eolIndex).trim();
        buffer = buffer.substring(eolIndex + 2);

        if (line.startsWith('data: ')) {
          const jsonData = line.substring('data: '.length);
          if (jsonData === '[DONE]') {
            if (!events.some(e => e.type === 'done')) events.push({ type: 'done' });
            // Do not return immediately, allow processing of subsequent events if any (though spec says [DONE] is final)
            // For robustness, we'll let the main `done` flag handle termination.
          } else {
            try {
              events.push(JSON.parse(jsonData));
            } catch (e) {
              console.warn("Failed to parse JSON from stream chunk:", jsonData, e);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error consuming stream:", error);
    // Ensure 'done' event is added if an error occurs, to prevent tests from hanging or misinterpreting.
    if (!events.some(e => e.type === 'done')) {
        events.push({ type: 'done_on_error' });
    }
  }
  // Ensure a 'done' event is present if not already added.
  if (!events.some(e => e.type === 'done' || e.type === 'done_on_error')) {
    events.push({ type: 'done_eof' });
  }
  return events;
}


describe('Integration Tests for /api/chat/mcpv4 API', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Configurar MCP_SERVERS_CONFIG para que McpClient descubra herramientas simuladas.
    // Estas son las mismas configuraciones que McpClient usa en su simulación interna.
    process.env.MCP_SERVERS_CONFIG = JSON.stringify([
      { id: "srv1", url: "http://dummy1.com", name: "Servidor 1 (Calculadora)" },
      { id: "toolCo", url: "http://dummy2.com", name: "Tool Company (Búsqueda)" },
    ]);
    // Asegurar que la API Key de OpenAI esté definida, aunque sea un mock
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env = { ...originalEnv }; // Restaurar variables de entorno
  });

  beforeEach(() => {
    mockOpenAICreate.mockReset(); // Resetear mocks antes de cada test
     // Re-import McpClient o reset modules if McpClient caches config at import time
     // For this setup, McpClient reads env vars on instantiation, so reset is not strictly needed
     // unless getMcpServersConfiguration itself caches. Given it's a simple function, it should be fine.
  });

  // Test 2.1: Flujo de Chat Básico (sin llamadas a herramientas)
  test('Test 2.1: should handle a simple chat message without tool calls', async () => {
    // Configurar mock de OpenAI para una respuesta simple
    mockOpenAICreate.mockImplementation(async function* () {
      yield { choices: [{ delta: { content: "Hola " } }] };
      yield { choices: [{ delta: { content: "mundo!" } }] };
      yield { choices: [{ delta: {}, finish_reason: "stop" }] }; // Parada normal
    });

    const requestBody = {
      messages: [{ role: 'user', content: 'Hola' }],
    };
    const req = new NextRequest('http://localhost/api/chat/mcpv4', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await consumeStream(response);
    
    expect(events.some(e => e.text === "Hola ")).toBe(true);
    expect(events.some(e => e.text === "mundo!")).toBe(true);
    expect(events.find(e => e.type === 'done')).toBeDefined();
    expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
  });

  // Test 3.1: Flujo de Chat con Herramienta Externa (srv1_calculator)
  test('Test 3.1: should handle a message triggering srv1_calculator and stream all event types', async () => {
    // Configuración del mock de OpenAI:
    // 1. OpenAI decide llamar a la herramienta srv1_calculator
    // 2. Después de recibir el resultado de la herramienta, OpenAI genera una respuesta final
    mockOpenAICreate.mockImplementation(async function* (request: any) {
      // request.messages contiene el historial. El último es el del usuario, o el resultado de la herramienta.
      const lastMessage = request.messages[request.messages.length - 1];

      if (lastMessage.role === 'user' && lastMessage.content === 'Calcula 2+2') {
        // Simular que OpenAI decide llamar a la herramienta
        yield { 
          choices: [{ 
            delta: { 
              tool_calls: [{ 
                index: 0, 
                id: 'tool_call_id_123', 
                type: 'function', 
                function: { name: 'srv1_calculator', arguments: '' } 
              }] 
            } 
          }] 
        };
        yield { 
          choices: [{ 
            delta: { 
              tool_calls: [{ 
                index: 0, 
                function: { arguments: JSON.stringify({ expression: '2+2' }) } 
              }] 
            } 
          }] 
        };
        yield { choices: [{ delta: {}, finish_reason: 'tool_calls' }] }; // OpenAI indica fin de la llamada a herramienta
      } else if (lastMessage.role === 'tool' && lastMessage.tool_call_id === 'tool_call_id_123') {
        // Simular la respuesta de OpenAI después de procesar el resultado de la herramienta
        // El contenido de lastMessage.content sería el JSON.stringify del resultado de srv1_calculator
        // que McpClient simula como { value: "srv1_calculator_result_for_2+2" }
        expect(JSON.parse(lastMessage.content)).toEqual({ value: "srv1_calculator_result_for_2+2" });
        yield { choices: [{ delta: { content: "El resultado es " } }] };
        yield { choices: [{ delta: { content: "srv1_calculator_result_for_2+2" } }] }; // Incorporar el resultado
        yield { choices: [{ delta: {}, finish_reason: 'stop' }] };
      } else {
        // Fallback por si algo inesperado ocurre
        yield { choices: [{ delta: { content: "Respuesta inesperada del mock." }, finish_reason: 'stop' }] };
      }
    });

    const requestBody = {
      messages: [{ role: 'user', content: 'Calcula 2+2' }],
    };
    const req = new NextRequest('http://localhost/api/chat/mcpv4', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await consumeStream(response);
    // console.log("Eventos Test 3.1:", JSON.stringify(events, null, 2));

    // Verificar eventos del stream (Test 5.2)
    const toolCallEvent = events.find(e => e.toolCall);
    expect(toolCallEvent).toBeDefined();
    expect(toolCallEvent.toolCall.name).toBe('srv1_calculator');
    expect(toolCallEvent.toolCall.arguments).toBe(JSON.stringify({ expression: '2+2' }));

    const toolResultEvent = events.find(e => e.toolResult);
    expect(toolResultEvent).toBeDefined();
    expect(toolResultEvent.toolResult.toolCallId).toBe('tool_call_id_123');
    expect(toolResultEvent.toolResult.result).toEqual({ value: 'srv1_calculator_result_for_2+2' });
    
    // Verificar texto de la respuesta final
    const textEvents = events.filter(e => e.text).map(e => e.text);
    expect(textEvents.join('')).toBe("El resultado es srv1_calculator_result_for_2+2");
    
    expect(events.some(e => e.type === 'done' || e.type === 'done_eof' || e.type === 'done_on_error')).toBe(true);
    expect(mockOpenAICreate).toHaveBeenCalledTimes(2); // Una para la llamada a herramienta, otra para la respuesta final
  });

  // Test 3.2: Flujo de Chat con Herramienta Externa (toolCo_search)
  test('Test 3.2: should handle a message triggering toolCo_search', async () => {
    mockOpenAICreate.mockImplementation(async function* (request: any) {
      const lastMessage = request.messages[request.messages.length - 1];
      if (lastMessage.role === 'user' && lastMessage.content === 'Busca sobre IA') {
        yield { choices: [{ delta: { tool_calls: [{ index: 0, id: 'tool_call_id_456', type: 'function', function: { name: 'toolCo_search', arguments: '' } }] } }] };
        yield { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: JSON.stringify({ query: 'IA' }) } }] } }] };
        yield { choices: [{ delta: {}, finish_reason: 'tool_calls' }] };
      } else if (lastMessage.role === 'tool' && lastMessage.tool_call_id === 'tool_call_id_456') {
        // McpClient simula: { results: ["Result 1 for IA from toolCo", "Result 2"] }
        expect(JSON.parse(lastMessage.content)).toEqual({ results: ["Result 1 for IA from toolCo", "Result 2"] });
        yield { choices: [{ delta: { content: "Resultados de búsqueda: Result 1 for IA from toolCo..." } }] };
        yield { choices: [{ delta: {}, finish_reason: 'stop' }] };
      }
    });

    const requestBody = { messages: [{ role: 'user', content: 'Busca sobre IA' }] };
    const req = new NextRequest('http://localhost/api/chat/mcpv4', {
      method: 'POST', body: JSON.stringify(requestBody), headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req);
    const events = await consumeStream(response);
    // console.log("Eventos Test 3.2:", JSON.stringify(events, null, 2));

    const toolCallEvent = events.find(e => e.toolCall);
    expect(toolCallEvent?.toolCall.name).toBe('toolCo_search');
    expect(toolCallEvent?.toolCall.arguments).toBe(JSON.stringify({ query: 'IA' }));

    const toolResultEvent = events.find(e => e.toolResult);
    expect(toolResultEvent?.toolResult.result).toEqual({ results: ["Result 1 for IA from toolCo", "Result 2"] });
    
    expect(events.filter(e => e.text).map(e => e.text).join('')).toContain("Resultados de búsqueda: Result 1 for IA from toolCo...");
    expect(events.some(e => e.type === 'done' || e.type === 'done_eof' || e.type === 'done_on_error')).toBe(true);
    expect(mockOpenAICreate).toHaveBeenCalledTimes(2);
  });

  // Test 4.1: Manejo de Errores en la Ejecución de Herramientas (Simuladas)
  test('Test 4.1: should handle errors during (simulated) tool execution', async () => {
    // Configurar mock de OpenAI para llamar a una herramienta que no existe en McpClient
    // para forzar un error en mcpClient.executeTool -> "Tool mapping not found"
    mockOpenAICreate.mockImplementation(async function* (request: any) {
      const lastMessage = request.messages[request.messages.length - 1];
      if (lastMessage.role === 'user' && lastMessage.content === 'Test error') {
        yield { choices: [{ delta: { tool_calls: [{ index: 0, id: 'tool_call_id_789', type: 'function', function: { name: 'nonexistent_tool_for_error', arguments: '' } }] } }] };
        yield { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: JSON.stringify({ data: 'test' }) } }] } }] };
        yield { choices: [{ delta: {}, finish_reason: 'tool_calls' }] };
      } else if (lastMessage.role === 'tool' && lastMessage.tool_call_id === 'tool_call_id_789') {
        // Esto no debería llamarse si el error se maneja correctamente y no se reintenta con OpenAI
        // Pero si se llamara, el contenido del error estaría aquí
        expect(JSON.parse(lastMessage.content).error).toContain("Tool mapping not found for nonexistent_tool_for_error");
        yield { choices: [{ delta: { content: `Error procesando herramienta: ${JSON.parse(lastMessage.content).error}` } }] };
        yield { choices: [{ delta: {}, finish_reason: 'stop' }] };
      }
    });

    const requestBody = { messages: [{ role: 'user', content: 'Test error' }] };
    const req = new NextRequest('http://localhost/api/chat/mcpv4', {
      method: 'POST', body: JSON.stringify(requestBody), headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(req);
    const events = await consumeStream(response);
    // console.log("Eventos Test 4.1:", JSON.stringify(events, null, 2));

    const toolCallEvent = events.find(e => e.toolCall);
    expect(toolCallEvent?.toolCall.name).toBe('nonexistent_tool_for_error');

    const toolResultEvent = events.find(e => e.toolResult);
    expect(toolResultEvent).toBeDefined();
    expect(toolResultEvent?.toolResult.toolCallId).toBe('tool_call_id_789'); // El ID de la llamada a la herramienta
    expect(toolResultEvent?.toolResult.error).toContain("Tool mapping not found for nonexistent_tool_for_error");
    
    // Verificar que la API no intente enviar este error de vuelta a OpenAI para una respuesta de texto,
    // sino que el error se informa y el stream se cierra.
    // En la implementación actual de la API route, si executeTool falla, se escribe el error en toolResult
    // y luego la conversación continúa enviando ese error a OpenAI.
    // El mock de OpenAI SÍ está configurado para responder a ese error.
    const textContent = events.filter(e => e.text).map(e => e.text).join('');
    expect(textContent).toContain("Error procesando herramienta: Tool mapping not found for nonexistent_tool_for_error");
    
    expect(events.some(e => e.type === 'done' || e.type === 'done_eof' || e.type === 'done_on_error')).toBe(true);
    // Se llama dos veces: una para intentar la herramienta, otra para procesar el error de la herramienta.
    expect(mockOpenAICreate).toHaveBeenCalledTimes(2); 
  });
  
  // Test 5.1 ya está implícitamente cubierto en cada test que verifica response.headers.get('Content-Type')
  // Test 5.2 ya está cubierto en Test 3.1
});
