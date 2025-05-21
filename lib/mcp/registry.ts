import { weatherTool } from "./tools/weather";
import { searchTool } from "./tools/search";
import { calculatorTool } from "./tools/calculator";
import { currencyTool } from "./tools/currency";
import { newsTool } from "./tools/news";
import { echoTool } from "./tools/echoTool";

// Registro central de herramientas
export const registry = {
  tools: [
    weatherTool, 
    searchTool, 
    calculatorTool, 
    currencyTool, 
    newsTool,
    echoTool,
  ],
  toolsMeta: [
    weatherTool.meta, 
    searchTool.meta, 
    calculatorTool.meta, 
    currencyTool.meta, 
    newsTool.meta,
    echoTool.meta,
  ],
};

// Función para ejecutar una herramienta por nombre
export async function executeTool(call: any) {
  const tool = registry.tools.find(t => t.meta.name === call.name);
  if (!tool) {
    return { error: `Herramienta no encontrada: ${call.name}` };
  }
  
  try {
    return await tool.run(call.arguments);
  } catch (error) {
    console.error(`Error al ejecutar herramienta ${call.name}:`, error);
    return { error: `Error al ejecutar la herramienta: ${error}` };
  }
}
