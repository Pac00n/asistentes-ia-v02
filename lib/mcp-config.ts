// lib/mcp-config.ts

import { spawn, ChildProcess } from 'child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'; // Para la instancia SDK del servidor, si se almacena

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  sdk_server_instance?: McpServer; // Instancia del servidor SDK (opcional)
  process?: ChildProcess; // El proceso hijo real que se ha generado
}

// Configuración de servidores MCP disponibles
export const mcpServers: Record<string, MCPServerConfig> = {
  filesystem: {
    name: "Filesystem",
    command: "npx",
    // ADVERTENCIA: Esta ruta está codificada y podría no funcionar en tu entorno.
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/ubuntu/mcp_implementacion/allowed_files"],
    env: {}
  },
  memory: {
    name: "Memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {}
  },
  // Añade más servidores según necesites
};

// Función para iniciar un servidor MCP y devolver el ChildProcess
export async function startMCPServer(serverKey: string): Promise<ChildProcess | null> {
  const config = mcpServers[serverKey];
  if (!config) {
    console.error(`[MCP Config] Configuración no encontrada para el servidor: ${serverKey}`);
    return null;
  }

  if (config.process && !config.process.killed) {
    console.log(`[MCP Config] El servidor ${serverKey} ya está en ejecución (PID: ${config.process.pid}).`);
    return config.process;
  }
  
  try {
    console.log(`[MCP Config] Iniciando servidor ${serverKey} con comando: ${config.command} ${config.args.join(' ')}`);
    const serverProcess = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env }, // Combina env del sistema con env personalizado
      stdio: ['pipe', 'pipe', 'pipe'], // Importante para StdioClientTransport
    });
    
    mcpServers[serverKey].process = serverProcess;

    serverProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`[MCP Server ${serverKey} STDOUT]: ${data.toString().trim()}`);
    });
    
    serverProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[MCP Server ${serverKey} STDERR]: ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (err: Error) => {
      console.error(`[MCP Server ${serverKey} Process Error]: Error al iniciar o ejecutar el proceso del servidor: ${err.message}`);
      if (mcpServers[serverKey]) {
        mcpServers[serverKey].process = undefined; // Limpiar
      }
    });

    serverProcess.on('exit', (code: number | null, signal: string | null) => {
      console.log(`[MCP Server ${serverKey} Process Exit]: El proceso del servidor terminó con código ${code} y señal ${signal}`);
      if (mcpServers[serverKey]) {
        mcpServers[serverKey].process = undefined; // Limpiar
        mcpServers[serverKey].sdk_server_instance = undefined;
      }
    });
    
    // Esperar un breve momento para permitir que el servidor se inicie.
    // Una solución más robusta implicaría un health check o esperar un mensaje específico.
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    if (serverProcess.exitCode !== null || serverProcess.killed) {
        console.error(`[MCP Config] El proceso del servidor ${serverKey} terminó prematuramente o no se pudo iniciar.`);
        mcpServers[serverKey].process = undefined;
        return null;
    }

    console.log(`[MCP Config] Servidor ${serverKey} iniciado con PID: ${serverProcess.pid}.`);
    
    return serverProcess;

  } catch (error: any) {
    console.error(`[MCP Config] Excepción al iniciar el servidor MCP ${serverKey}:`, error.message);
    if (mcpServers[serverKey]) {
        mcpServers[serverKey].process = undefined; // Limpiar
    }
    return null;
  }
}

// Función para detener un servidor MCP
export function stopMCPServer(serverKey: string): boolean {
  const config = mcpServers[serverKey];
  if (!config || !config.process || config.process.killed) {
    console.log(`[MCP Config] El servidor ${serverKey} no está en ejecución o ya fue detenido.`);
    if (config?.process?.killed) { 
        mcpServers[serverKey].process = undefined;
        mcpServers[serverKey].sdk_server_instance = undefined;
    }
    return true; 
  }
  
  const pid = config.process.pid;
  try {
    console.log(`[MCP Config] Deteniendo servidor ${serverKey} (PID: ${pid})...`);
    const killed = config.process.kill('SIGTERM'); 
    
    if (killed) {
      console.log(`[MCP Config] Señal SIGTERM enviada al servidor ${serverKey} (PID: ${pid}).`);
    } else {
      console.warn(`[MCP Config] No se pudo enviar SIGTERM a ${serverKey} (PID: ${pid}). Puede que ya estuviera detenido. Intentando SIGKILL.`);
      config.process.kill('SIGKILL');
    }

    mcpServers[serverKey].process = undefined;
    mcpServers[serverKey].sdk_server_instance = undefined;
    console.log(`[MCP Config] Referencias del servidor ${serverKey} (PID: ${pid}) limpiadas.`);
    return true;

  } catch (error: any) {
    console.error(`[MCP Config] Error al detener el servidor MCP ${serverKey} (PID: ${pid}):`, error.message);
    if (mcpServers[serverKey]) {
        mcpServers[serverKey].process = undefined;
        mcpServers[serverKey].sdk_server_instance = undefined;
    }
    return false;
  }
}