Leete este documento en docs// lib/mcp-config.ts

import { spawn, ChildProcess } from 'child_process';
// Reverting to the specific path import WITH .js extension, as per the successful implementation document
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  server?: McpServer;
  process?: ChildProcess;
}

export const mcpServers: Record<string, MCPServerConfig> = {
  filesystem: {
    name: "Filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./allowed_mcp_files"],
    env: {}
  },
  memory: {
    name: "Memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {}
  },
  github: {
    name: "GitHub",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      "GITHUB_PERSONAL_ACCESS_TOKEN": process.env.GITHUB_TOKEN || ""
    }
  },
};

export async function startMCPServer(serverKey: string): Promise<McpServer | null> {
  const config = mcpServers[serverKey];
  if (!config) {
    console.error(`[MCP Config] No configuration found for server key: ${serverKey}`);
    return null;
  }
  
  if (config.process && config.process.pid && !config.process.killed) {
    console.log(`[MCP Config] Server ${serverKey} (PID: ${config.process.pid}) is already running or starting.`);
    return config.server || null; 
  }

  try {
    console.log(`[MCP Config] Starting server ${serverKey} with command: ${config.command} ${config.args.join(' ')}`);
    const serverProcess = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    config.process = serverProcess;
    
    serverProcess.stdout.on('data', (data: Buffer) => {
      console.log(`[MCP ${serverKey} STDOUT] ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data: Buffer) => {
      console.error(`[MCP ${serverKey} STDERR] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (error: Error) => {
      console.error(`[MCP ${serverKey} Process Error] Failed to start server:`, error);
      if (mcpServers[serverKey]) {
        mcpServers[serverKey].process = undefined;
      }
    });
    
    serverProcess.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      console.log(`[MCP ${serverKey}] Server process exited with code ${code} and signal ${signal}`);
      if (mcpServers[serverKey]) {
          mcpServers[serverKey].process = undefined;
          mcpServers[serverKey].server = undefined;
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    
    // Using the McpServer constructor as per the successful implementation document
    const server = new McpServer({
      name: config.name,
      version: "1.0.0", 
      capabilities: {
        resources: {},
        tools: {},
      },
    });
    
    mcpServers[serverKey].server = server;
    console.log(`[MCP Config] Server ${serverKey} process initiated (PID: ${serverProcess.pid}). McpServer object created.`);
    return server;
  } catch (error) {
    console.error(`[MCP Config] Error initiating MCP server ${serverKey}:`, error);
    if (mcpServers[serverKey]) {
        mcpServers[serverKey].process = undefined;
    }
    return null;
  }
}

export function stopMCPServer(serverKey: string): boolean {
  const config = mcpServers[serverKey];
  if (!config || !config.process || config.process.killed) {
    console.log(`[MCP Config] Server ${serverKey} not running or no process found to stop.`);
    return false;
  }
  
  try {
    console.log(`[MCP Config] Stopping server ${serverKey} (PID: ${config.process.pid})...`);
    const killed = config.process.kill(); 
    if (killed) {
        console.log(`[MCP Config] Server ${serverKey} stop signal sent.`);
    } else {
        console.error(`[MCP Config] Failed to send stop signal to server ${serverKey}.`);
    }
    return killed;
  } catch (error) {
    console.error(`[MCP Config] Error stopping MCP server ${serverKey}:`, error);
    return false;
  }
}

export function stopAllMCPServers(): void {
  console.log("[MCP Config] Attempting to stop all active MCP servers...");
  Object.keys(mcpServers).forEach(serverKey => {
    const config = mcpServers[serverKey];
    if (config && config.process && config.process.pid && !config.process.killed) {
      stopMCPServer(serverKey);
    }
  });
  console.log("[MCP Config] All active MCP servers stop command issued.");
}
