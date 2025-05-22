// Archivo de prueba para validar la integración con servidores MCP externos
// Este script prueba la funcionalidad del cliente MCP con un servidor real

// Importamos desde los archivos compilados
const { McpClient } = require('../../dist/mcp/client');

// Función para ejecutar pruebas con el servidor MCP externo
async function runTests() {
  console.log("Iniciando pruebas de integración con servidor MCP externo...");
  
  try {
    // Configurar la variable de entorno para apuntar al servidor de prueba
    process.env.MCP_SERVERS_CONFIG = JSON.stringify([
      { id: "test", url: "http://localhost:3001", name: "Servidor de Prueba" }
    ]);
    
    // Crear una instancia del cliente MCP
    const client = new McpClient();
    
    // Prueba 1: Inicializar y descubrir herramientas
    console.log("\n--- Prueba 1: Inicialización y descubrimiento de herramientas ---");
    await client.initialize();
    
    const tools = client.getOpenAIToolDefinitions();
    console.log(`Herramientas descubiertas: ${tools.length}`);
    console.log(JSON.stringify(tools, null, 2));
    
    if (tools.length === 0) {
      console.error("Error: No se descubrieron herramientas");
      return;
    }
    
    // Prueba 2: Ejecutar herramienta calculator
    console.log("\n--- Prueba 2: Ejecutar herramienta calculator ---");
    try {
      const calcResult = await client.executeTool("test_calculator", { expression: "5*7" });
      console.log("Resultado de calculator:", calcResult);
    } catch (error) {
      console.error("Error al ejecutar calculator:", error.message);
    }
    
    // Prueba 3: Ejecutar herramienta weather
    console.log("\n--- Prueba 3: Ejecutar herramienta weather ---");
    try {
      const weatherResult = await client.executeTool("test_weather", { city: "Madrid" });
      console.log("Resultado de weather:", weatherResult);
    } catch (error) {
      console.error("Error al ejecutar weather:", error.message);
    }
    
    // Prueba 4: Probar manejo de errores - herramienta inexistente
    console.log("\n--- Prueba 4: Manejo de errores - herramienta inexistente ---");
    try {
      await client.executeTool("test_nonexistent", { param: "value" });
      console.error("Error: Se esperaba un error pero la ejecución fue exitosa");
    } catch (error) {
      console.log("Error capturado correctamente:", error.message);
    }
    
    // Prueba 5: Probar manejo de errores - argumentos inválidos
    console.log("\n--- Prueba 5: Manejo de errores - argumentos inválidos ---");
    try {
      await client.executeTool("test_calculator", { invalid: "argument" });
      console.error("Error: Se esperaba un error pero la ejecución fue exitosa");
    } catch (error) {
      console.log("Error capturado correctamente:", error.message);
    }
    
    console.log("\n--- Resumen de pruebas ---");
    console.log("Pruebas completadas. Verificar los resultados anteriores para confirmar el funcionamiento.");
    
  } catch (error) {
    console.error("Error general durante las pruebas:", error);
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);
