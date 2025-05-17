// lib/mcp_clients/stdio.ts
import { BaseMCPClient } from './base';
import { spawn, ChildProcess } from 'child_process';

/**
 * Cliente MCP para servidores que usan el protocolo stdio.
 * Se comunica con un proceso externo a través de stdin/stdout.
 */
export class StdioMCPClient extends BaseMCPClient {
  private process: ChildProcess | null = null;
  private command: string;
  private args: string[];
  private buffer: string = '';
  private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();
  private nextRequestId: number = 1;

  constructor(serverId: string, command: string, args: string[] = []) {
    super(serverId);
    this.command = command;
    this.args = args;
  }

  /**
   * Inicia el proceso y establece los manejadores para stdin/stdout
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.connectionStatus = 'connecting';
        console.log(`StdioMCPClient: Iniciando proceso para servidor ${this.serverId}: ${this.command} ${this.args.join(' ')}`);
        console.log(`StdioMCPClient: RUTA COMPLETA: ${process.cwd()}/${this.args[0]}`);
        
        // Verificar si el archivo existe antes de intentar ejecutarlo
        try {
          const fs = require('fs');
          const path = require('path');
          const filePath = this.args[0];
          const fileExists = fs.existsSync(filePath);
          console.log(`StdioMCPClient: ¿El archivo ${filePath} existe? ${fileExists}`);
          
          if (!fileExists) {
            // Intentar buscar el archivo en rutas relativas
            const cwdFilePath = path.join(process.cwd(), filePath);
            const cwdFileExists = fs.existsSync(cwdFilePath);
            console.log(`StdioMCPClient: ¿El archivo ${cwdFilePath} existe? ${cwdFileExists}`);
          }
        } catch (fsError) {
          console.error(`StdioMCPClient: Error verificando archivo: ${fsError}`);
        }
        
        this.process = spawn(this.command, this.args);
        
        // Manejar datos del stdout
        this.process.stdout?.on('data', (data) => {
          this.handleProcessOutput(data.toString());
        });
        
        // Manejar errores
        this.process.stderr?.on('data', (data) => {
          console.error(`StdioMCPClient Error (${this.serverId}):`, data.toString());
        });
        
        // Manejar cierre del proceso
        this.process.on('close', (code) => {
          if (this.connectionStatus === 'connected') {
            console.log(`StdioMCPClient: Proceso para servidor ${this.serverId} cerrado con código ${code}`);
            this.connectionStatus = 'disconnected';
          }
        });
        
        // Manejar errores del proceso
        this.process.on('error', (err) => {
          console.error(`StdioMCPClient: Error en proceso para servidor ${this.serverId}:`, err);
          const prevStatus = this.connectionStatus;
          this.connectionStatus = 'error';
          if (prevStatus === 'connecting') {
            reject(err);
          }
        });
        
        // Verificar que el proceso está en ejecución antes de continuar
        setTimeout(() => {
          if (this.process && this.process.pid) {
            this.connectionStatus = 'connected';
            console.log(`StdioMCPClient: Conectado al servidor ${this.serverId} (PID: ${this.process.pid})`);
            resolve();
          } else {
            this.connectionStatus = 'error';
            reject(new Error(`No se pudo iniciar el proceso para el servidor ${this.serverId}`));
          }
        }, 1000);
        
      } catch (error) {
        this.connectionStatus = 'error';
        console.error(`StdioMCPClient: Error conectando al servidor ${this.serverId}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Termina el proceso
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      // Intentar cerrar el proceso correctamente
      this.process.kill();
      this.process = null;
    }
    this.connectionStatus = 'disconnected';
    console.log(`StdioMCPClient: Desconectado del servidor ${this.serverId}`);
  }

  /**
   * Lista las herramientas disponibles en el servidor
   */
  async listTools(): Promise<any[]> {
    if (this.connectionStatus !== 'connected') {
      throw new Error(`StdioMCPClient: No se puede listar herramientas. Estado de conexión: ${this.connectionStatus}`);
    }
    
    const response = await this.sendRequest('list_tools', {});
    return response.tools || [];
  }

  /**
   * Ejecuta una herramienta en el servidor
   */
  async callTool(toolName: string, parameters: any): Promise<any> {
    console.log(`StdioMCPClient: Intentando ejecutar herramienta ${toolName} en servidor ${this.serverId}`);
    console.log(`StdioMCPClient: Estado de conexión actual: ${this.connectionStatus}`);
    console.log(`StdioMCPClient: ¿Proceso activo? ${this.process ? 'Sí, PID: ' + this.process.pid : 'No'}`);
    
    if (this.connectionStatus !== 'connected') {
      console.error(`StdioMCPClient: No se puede ejecutar herramienta. Estado de conexión: ${this.connectionStatus}`);
      throw new Error(`StdioMCPClient: No se puede ejecutar herramienta. Estado de conexión: ${this.connectionStatus}`);
    }
    
    console.log(`StdioMCPClient: Enviando solicitud 'call_tool' para ${toolName} con parámetros:`, parameters);
    const response = await this.sendRequest('call_tool', {
      tool_name: toolName,
      parameters: parameters
    });
    
    console.log(`StdioMCPClient: Respuesta recibida para ${toolName}:`, response);
    return response.result;
  }

  /**
   * Envía una solicitud al proceso a través de stdin
   */
  private async sendRequest(action: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        return reject(new Error('No hay proceso activo para enviar la solicitud'));
      }
      
      const requestId = `req_${this.nextRequestId++}`;
      const request = {
        id: requestId,
        action,
        data
      };
      
      // Almacenar callbacks para resolver/rechazar cuando llegue la respuesta
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Enviar la solicitud al proceso
      this.process.stdin?.write(JSON.stringify(request) + '\n');
      
      // Establecer un timeout para la solicitud
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Timeout para solicitud ${requestId} al servidor ${this.serverId}`));
        }
      }, 30000); // 30 segundos de timeout
    });
  }

  /**
   * Procesa la salida del proceso
   */
  private handleProcessOutput(data: string): void {
    // Añadir datos al buffer
    this.buffer += data;
    
    // Procesar líneas completas
    let endIndex: number;
    while ((endIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, endIndex).trim();
      this.buffer = this.buffer.substring(endIndex + 1);
      
      if (line) {
        try {
          // Verificar si la línea parece ser JSON (empieza con { o [)
          if (line.startsWith('{') || line.startsWith('[')) {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } else {
            // Si no es JSON, simplemente lo registramos como mensaje del servidor
            console.log(`StdioMCPClient: Mensaje del servidor ${this.serverId} (no JSON): ${line}`);
          }
        } catch (error) {
          console.error(`StdioMCPClient: Error parseando respuesta del servidor ${this.serverId}:`, error);
        }
      }
    }
  }

  /**
   * Maneja una respuesta del proceso
   */
  private handleResponse(response: any): void {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id)!;
      this.pendingRequests.delete(response.id);
      
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.data);
      }
    }
  }
}
