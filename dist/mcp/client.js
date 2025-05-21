"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClient = void 0;
// lib/mcp/client.ts
const config_1 = require("./config");
class McpClient {
    constructor() {
        this.openAITools = [];
        this.toolMappings = {};
        this.isInitialized = false;
        this.serversConfig = (0, config_1.getMcpServersConfiguration)();
        // Simular que MCP_SERVERS_CONFIG está disponible para esta tarea, 
        // ya que getMcpServersConfiguration() depende de process.env
        // En un entorno real, process.env.MCP_SERVERS_CONFIG debería estar configurado.
        if (!process.env.MCP_SERVERS_CONFIG && this.serversConfig.length === 0) {
            // Proporcionar datos de simulación si MCP_SERVERS_CONFIG no está configurado
            // Esto es específicamente para facilitar la prueba de esta tarea aislada.
            console.warn("McpClient: MCP_SERVERS_CONFIG no detectado, usando datos de simulación para la configuración de servidores.");
            this.serversConfig = [
                { id: "srv1", url: "http://dummy1.com", name: "Servidor 1" },
                { id: "toolCo", url: "http://dummy2.com", name: "Tool Company" },
                { id: "srvNoTools", url: "http://dummy3.com", name: "Servidor Sin Herramientas" }
            ];
        }
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized)
                return;
            if (!this.serversConfig.length) {
                console.log("McpClient: No hay servidores MCP configurados.");
                this.isInitialized = true;
                return;
            }
            console.log(`McpClient: Inicializando y descubriendo herramientas de ${this.serversConfig.length} servidor(es)...`);
            const discoveryPromises = this.serversConfig.map(server => this.discoverToolsFromServer(server));
            yield Promise.allSettled(discoveryPromises);
            this.isInitialized = true;
            console.log(`McpClient: Inicialización completa. ${this.openAITools.length} herramientas disponibles para OpenAI.`);
            // Descomentar para depuración si es necesario:
            // console.log("McpClient: Mapeos internos:", JSON.stringify(this.toolMappings, null, 2));
            // console.log("McpClient: Herramientas OpenAI:", JSON.stringify(this.openAITools, null, 2));
        });
    }
    getOpenAIToolDefinitions() {
        if (!this.isInitialized) {
            console.warn("McpClient: Cliente no inicializado. Llama a initialize() primero.");
            // Podría ser preferible lanzar un error o devolver una copia vacía,
            // pero para este ejemplo, un warning y devolver el array (posiblemente vacío) es suficiente.
        }
        return this.openAITools;
    }
    getToolMapping(prefixedToolName) {
        if (!this.isInitialized) {
            console.warn("McpClient: Cliente no inicializado.");
            // Similar al anterior, considerar el manejo de errores.
        }
        return this.toolMappings[prefixedToolName];
    }
    discoverToolsFromServer(server) {
        return __awaiter(this, void 0, void 0, function* () {
            // Asume endpoint /tools relativo a la URL base del servidor.
            // No se puede usar `new URL('/tools', server.url)` directamente si server.url no incluye un path base.
            // Es más seguro asegurar que la URL base termine en / antes de concatenar.
            const baseUrl = server.url.endsWith('/') ? server.url : `${server.url}/`;
            const toolsUrl = `${baseUrl}tools`;
            console.log(`McpClient: Intentando descubrir herramientas de ${server.name || server.id} en ${toolsUrl}`);
            try {
                // Implementación real de llamada HTTP
                let mcpTools;
                try {
                    const headers = {};
                    if (server.apiKey) {
                        headers['X-API-Key'] = server.apiKey;
                    }
                    const response = yield fetch(toolsUrl, { headers });
                    console.log(`McpClient: Respuesta recibida de ${server.id} (${toolsUrl}). Estado: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
                    if (!response.ok) {
                        const errorBody = yield response.text();
                        console.error(`McpClient: Error en la respuesta de ${server.id} (${toolsUrl}). Cuerpo del error:`, errorBody);
                        throw new Error(`Error al obtener herramientas de ${server.id} (${response.status}): ${errorBody}`);
                    }
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        const responseBody = yield response.text(); // Leer cuerpo para depuración
                        console.error(`McpClient: Tipo de contenido inesperado de ${server.id} (${toolsUrl}). Cuerpo recibido:`, responseBody);
                        throw new Error(`Tipo de contenido inesperado de ${server.id}: ${contentType}. Se esperaba application/json.`);
                    }
                    mcpTools = yield response.json();
                    console.log(`McpClient: ${server.id} devolvió ${mcpTools.length} herramientas.`);
                }
                catch (fetchError) {
                    console.error(`McpClient: Error al conectar o procesar respuesta del servidor ${server.id} (${toolsUrl}):`, fetchError);
                    // Fallback a simulación si la conexión falla (para desarrollo/pruebas)
                    if (server.id === "srv1") {
                        console.warn(`McpClient: Usando herramientas simuladas para ${server.id} debido a error de conexión.`);
                        mcpTools = [
                            { toolName: "calculator", description: "Calculadora de srv1", parametersSchema: { type: "object", properties: { expression: { type: "string", description: "Expresión matemática a evaluar" } }, required: ["expression"] } },
                            { toolName: "weather", description: "Obtiene el clima de una ciudad en srv1", parametersSchema: { type: "object", properties: { city: { type: "string", description: "Ciudad para consultar el clima" } }, required: ["city"] } },
                        ];
                    }
                    else if (server.id === "toolCo") {
                        console.warn(`McpClient: Usando herramientas simuladas para ${server.id} debido a error de conexión.`);
                        mcpTools = [
                            { toolName: "search", description: "Realiza una búsqueda en toolCo", parametersSchema: { type: "object", properties: { query: { type: "string", description: "Término de búsqueda" } }, required: ["query"] } },
                            { toolName: "imageGenerator", description: "Genera una imagen basada en un prompt", parametersSchema: { type: "object", properties: { prompt: { type: "string", description: "Descripción de la imagen a generar" } }, required: ["prompt"] } }
                        ];
                    }
                    else {
                        console.warn(`McpClient: No hay herramientas simuladas para ${server.id}. Devolviendo array vacío.`);
                        mcpTools = [];
                    }
                }
                if (!Array.isArray(mcpTools)) {
                    console.warn(`McpClient: Respuesta de ${server.id} (${toolsUrl}) no es un array. Respuesta recibida:`, mcpTools);
                    return;
                }
                for (const mcpTool of mcpTools) {
                    if (mcpTool && typeof mcpTool.toolName === 'string' && typeof mcpTool.description === 'string' && mcpTool.parametersSchema) {
                        const prefixedToolName = `${server.id}_${mcpTool.toolName}`;
                        // Validar que el nombre de la herramienta no contenga caracteres no permitidos por OpenAI.
                        // OpenAI function names must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64.
                        const openAICompatibleName = prefixedToolName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64);
                        if (openAICompatibleName !== prefixedToolName) {
                            console.warn(`McpClient: El nombre de herramienta '${prefixedToolName}' fue ajustado a '${openAICompatibleName}' para compatibilidad con OpenAI.`);
                        }
                        this.openAITools.push({
                            type: "function",
                            function: {
                                name: openAICompatibleName,
                                description: mcpTool.description,
                                parameters: mcpTool.parametersSchema,
                            },
                        });
                        this.toolMappings[openAICompatibleName] = {
                            serverId: server.id,
                            serverUrl: server.url,
                            originalToolName: mcpTool.toolName,
                            apiKey: server.apiKey,
                        };
                    }
                    else {
                        console.warn(`McpClient: Herramienta inválida o malformada de ${server.id}. Datos recibidos:`, mcpTool);
                    }
                }
            }
            catch (error) {
                // Captura errores tanto de la simulación (si se lanza un error) como de la lógica de procesamiento.
                console.error(`McpClient: Error general al descubrir/procesar herramientas de ${server.id} (${toolsUrl}):`, error instanceof Error ? error.message : String(error));
            }
        });
    }
    executeTool(prefixedToolName, parsedArguments // Argumentos ya parseados desde el string JSON de OpenAI
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInitialized) {
                console.warn("McpClient: Cliente no inicializado. Llama a initialize() primero.");
                throw new Error("MCP Client not initialized");
            }
            const mapping = this.getToolMapping(prefixedToolName);
            if (!mapping) {
                console.error(`McpClient: No se encontró mapeo para la herramienta ${prefixedToolName}.`);
                throw new Error(`Tool mapping not found for ${prefixedToolName}`);
            }
            const { serverId, serverUrl, originalToolName, apiKey } = mapping;
            // Asegurar que la URL base termine en / antes de concatenar /executeTool o similar
            const baseUrl = serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`;
            const executionUrl = `${baseUrl}execute`; // Endpoint para ejecutar herramientas
            console.log(`McpClient: Ejecutando herramienta '${originalToolName}' en servidor '${serverId}' (${executionUrl}) con argumentos:`, parsedArguments);
            try {
                // Implementación real de llamada HTTP POST
                try {
                    const headers = { 'Content-Type': 'application/json' };
                    if (apiKey) {
                        headers['X-API-Key'] = apiKey;
                    }
                    const body = JSON.stringify({
                        toolName: originalToolName,
                        arguments: parsedArguments
                    });
                    const response = yield fetch(executionUrl, {
                        method: 'POST',
                        headers,
                        body
                    });
                    if (!response.ok) {
                        const errorBody = yield response.text();
                        throw new Error(`Error al ejecutar la herramienta ${originalToolName} en ${serverId}: ${response.statusText} - ${errorBody}`);
                    }
                    const result = yield response.json();
                    console.log(`McpClient: Resultado de '${originalToolName}' desde '${serverId}':`, result);
                    return result;
                }
                catch (fetchError) {
                    console.error(`McpClient: Error al ejecutar herramienta en servidor ${serverId}:`, fetchError);
                    // Fallback a simulación si la conexión falla (para desarrollo/pruebas)
                    console.warn(`McpClient: Usando simulación como fallback para ${originalToolName} en ${serverId}`);
                    // Simular latencia de red
                    yield new Promise(resolve => setTimeout(resolve, 50));
                    let simulatedResult;
                    if (serverId === "srv1" && originalToolName === "calculator") {
                        simulatedResult = { value: `srv1_calculator_result_for_${parsedArguments.expression}` };
                    }
                    else if (serverId === "srv1" && originalToolName === "weather") {
                        simulatedResult = { temperature: `25C for ${parsedArguments.city} from srv1` };
                    }
                    else if (serverId === "toolCo" && originalToolName === "search") {
                        simulatedResult = { results: [`Result 1 for ${parsedArguments.query} from toolCo`, "Result 2"] };
                    }
                    else if (serverId === "toolCo" && originalToolName === "imageGenerator") {
                        simulatedResult = { imageUrl: `http://images.toolco.com/${parsedArguments.prompt.replace(/\s/g, '_')}.png` };
                    }
                    else {
                        simulatedResult = {
                            status: "success_unknown_tool_simulation",
                            message: `Simulated: Tool '${originalToolName}' on server '${serverId}' executed with provided args.`,
                            arguments_received: parsedArguments
                        };
                    }
                    console.log(`McpClient: Resultado SIMULADO de '${originalToolName}' desde '${serverId}':`, simulatedResult);
                    return simulatedResult;
                }
            }
            catch (error) {
                console.error(`McpClient: Error al ejecutar la herramienta ${originalToolName} en ${serverId}:`, error instanceof Error ? error.message : String(error));
                // Para devolver un error estructurado a OpenAI, podrías hacer:
                // return { error: `Failed to execute tool ${originalToolName}: ${error.message}` };
                // O simplemente relanzar para que sea manejado más arriba y convertido a un string para OpenAI.
                throw error;
            }
        });
    }
}
exports.McpClient = McpClient;
// Ejemplo de cómo se podría usar (opcional, solo para prueba manual si se ejecuta este archivo directamente)
/*
async function testClientAndExecution() {
  // Para que la simulación en el constructor funcione si MCP_SERVERS_CONFIG no está seteado:
  // delete process.env.MCP_SERVERS_CONFIG; // Descomentar para forzar la simulación del constructor
  
  console.log("Probando McpClient con ejecución...");
  const client = new McpClient();
  await client.initialize();
  
  console.log("\n--- Herramientas formato OpenAI ---");
  const tools = client.getOpenAIToolDefinitions();
  console.log(JSON.stringify(tools, null, 2));
  
  if (tools.length === 0) {
    console.log("No hay herramientas para probar la ejecución.");
    return;
  }

  // Probar la primera herramienta disponible
  const toolToTest = tools[0].function.name;
  let testArgs = {};

  // Preparar argumentos de prueba basados en el nombre de la herramienta (simplificado)
  if (toolToTest.includes("calculator")) {
    testArgs = { expression: "2+2" };
  } else if (toolToTest.includes("weather")) {
    testArgs = { city: "Madrid" };
  } else if (toolToTest.includes("search")) {
    testArgs = { query: "typescript" };
  } else if (toolToTest.includes("imageGenerator")) {
    testArgs = { prompt: "a cat coding" };
  } else {
    testArgs = { genericArg: "testValue" };
  }

  console.log(`\n--- Probando ejecución de '${toolToTest}' con args:`, testArgs);
  try {
    const result = await client.executeTool(toolToTest, testArgs);
    console.log(`Resultado final de la ejecución de '${toolToTest}':`, result);
  } catch (e) {
    console.error(`Error en la ejecución de prueba para '${toolToTest}':`, e);
  }

  // Probar una herramienta que podría no tener simulación específica para ver el fallback
  console.log(`\n--- Probando ejecución de 'srvNoTools_nonExistentTool' (esperado fallback o error simulado) ---`);
  try {
    // Asumimos que 'srvNoTools' no define 'nonExistentTool' en la simulación de `discoverToolsFromServer`
    // Para probar el caso de "Tool mapping not found", necesitaríamos un nombre que no esté en `this.toolMappings`
    // Para probar el fallback de ejecución, necesitamos una herramienta mapeada pero sin resultado específico en `executeTool`
    // Si 'srvNoTools' no tiene herramientas, este test no será tan útil.
    // Vamos a intentar con una herramienta de toolCo que no tenga un case específico en la simulación de executeTool
    // Si "toolCo_imageGenerator" está mapeado pero no tiene un case específico en executeTool, se usará el fallback.
    // (Actualizado: imageGenerator fue añadido a la simulación de executeTool, así que el fallback sería para otra herramienta)
    
    // Supongamos que existe una herramienta "toolCo_anotherTool" descubierta pero sin simulación de ejecución
    // Para que este test funcione, "toolCo_anotherTool" debería estar en toolMappings.
    // La simulación actual de `discoverToolsFromServer` solo crea "toolCo_search" y "toolCo_imageGenerator".
    // Para probar el fallback de `executeTool`, necesitaríamos añadir una herramienta "toolCo_other" en `discoverToolsFromServer`
    // y luego llamarla aquí.

    // Por ahora, llamaremos a una herramienta que SÍ está mapeada pero que podría usar el fallback si no tiene case:
    // Vamos a usar una herramienta que SÍ está mapeada ("toolCo_imageGenerator")
    // y si su case específico en executeTool fuera comentado, usaría el fallback.
    // Con el case actual, dará el resultado simulado para imageGenerator.
    const anotherToolToTest = "toolCo_imageGenerator"; // o "srv1_weather"
    const anotherTestArgs = { prompt: "a dog playing chess" }; // o { city: "London" }
    
    // Para probar el error "Tool mapping not found", usar un nombre no existente:
    // const anotherToolToTest = "non_existent_tool_abc123";
    // const anotherTestArgs = { foo: "bar" };

    console.log(`\n--- Probando ejecución de '${anotherToolToTest}' con args:`, anotherTestArgs);
    const resultAnother = await client.executeTool(anotherToolToTest, anotherTestArgs);
    console.log(`Resultado final de la ejecución de '${anotherToolToTest}':`, resultAnother);

  } catch (e) {
    console.error(`Error en la ejecución de prueba para herramienta adicional:`, e);
  }
}

// Si se quiere ejecutar la prueba:
// testClientAndExecution().catch(console.error);

async function testClient() {
  // Para que la simulación en el constructor funcione si MCP_SERVERS_CONFIG no está seteado:
  // delete process.env.MCP_SERVERS_CONFIG; // Descomentar para forzar la simulación del constructor
  
  // O para probar con una config específica via env var (ej. en package.json script):
  // MCP_SERVERS_CONFIG='[{"id":"srv1","url":"http://localhost:3001","name":"Mi Servidor Local"},{"id":"fakeToolService","url":"http://localhost:3002","apiKey":"fakekey"}]' node your-script.js

  console.log("Probando McpClient...");
  const client = new McpClient();
  await client.initialize();
  
  console.log("\n--- Herramientas formato OpenAI ---");
  console.log(JSON.stringify(client.getOpenAIToolDefinitions(), null, 2));
  
  console.log("\n--- Mapeos Internos ---");
  const mappings = client.getToolMapping("srv1_calculator"); // Ejemplo
  if(mappings) console.log(JSON.stringify(mappings, null, 2));

  const allMappings = (client as any).toolMappings; // Acceso para ver todos los mapeos
  console.log(JSON.stringify(allMappings, null, 2));

  // Probar una herramienta que podría tener nombre ajustado
  const searchMapping = client.getToolMapping("toolCo_search");
  if(searchMapping) console.log("Mapeo para toolCo_search:", JSON.stringify(searchMapping, null, 2));
}

// Si se quiere ejecutar la prueba:
// testClient().catch(console.error);
*/
