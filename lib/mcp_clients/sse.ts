// lib/mcp_clients/sse.ts
import { BaseMCPClient } from './base';
import { EventSourcePolyfill, MessageEvent } from 'event-source-polyfill';
import fetch from 'node-fetch';

/**
 * Cliente MCP para servidores que usan el protocolo SSE (Server-Sent Events).
 * Se comunica con un servidor web mediante HTTP y SSE.
 */
export class SSEMCPClient extends BaseMCPClient {
  private baseUrl: string;
  private apiKey?: string;
  private eventSource: EventSourcePolyfill | null = null;
  private pendingRequests: Map<string, { resolve: Function, reject: Function, timer: NodeJS.Timeout }> = new Map();
  private nextRequestId: number = 1;

  constructor(serverId: string, baseUrl: string, apiKey?: string) {
    super(serverId);
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.apiKey = apiKey;
  }

  /**
   * Establece la conexión SSE con el servidor
   */
  async connect(): Promise<void> {
    if (this.connectionStatus === 'connected') {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.connectionStatus = 'connecting';
        console.log(`SSEMCPClient: Conectando al servidor ${this.serverId} en ${this.baseUrl}`);

        // Opciones para el EventSource
        const options: any = {
          headers: {
            'Accept': 'text/event-stream',
          }
        };

        // Añadir API key si se proporcionó
        if (this.apiKey) {
          options.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        // Crear la conexión SSE para recibir eventos del servidor
        this.eventSource = new EventSourcePolyfill(`${this.baseUrl}events`, options);

        // Manejar eventos del servidor
        this.eventSource.onopen = () => {
          this.connectionStatus = 'connected';
          console.log(`SSEMCPClient: Conectado al servidor ${this.serverId}`);
          resolve();
        };

        this.eventSource.onerror = (event) => {
          console.error(`SSEMCPClient: Error en la conexión con el servidor ${this.serverId}:`, event);
          if (this.connectionStatus === 'connecting') {
            this.connectionStatus = 'error';
            reject(new Error(`Error conectando con el servidor ${this.serverId}`));
          } else if (this.connectionStatus === 'connected') {
            this.connectionStatus = 'error';
          }
        };

        this.eventSource.addEventListener('message', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.id && this.pendingRequests.has(data.id)) {
              const { resolve, reject, timer } = this.pendingRequests.get(data.id)!;
              clearTimeout(timer);
              this.pendingRequests.delete(data.id);
              
              if (data.error) {
                reject(new Error(data.error));
              } else {
                resolve(data.data);
              }
            }
          } catch (error) {
            console.error(`SSEMCPClient: Error procesando evento del servidor ${this.serverId}:`, error);
          }
        });

        // Timeout para la conexión
        setTimeout(() => {
          if (this.connectionStatus !== 'connected') {
            this.disconnect().catch(() => {});
            this.connectionStatus = 'error';
            reject(new Error(`Timeout conectando con el servidor ${this.serverId}`));
          }
        }, 10000); // 10 segundos de timeout

      } catch (error) {
        this.connectionStatus = 'error';
        console.error(`SSEMCPClient: Error conectando al servidor ${this.serverId}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Cierra la conexión SSE
   */
  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    // Rechazar todas las solicitudes pendientes
    for (const [id, { reject, timer }] of this.pendingRequests.entries()) {
      clearTimeout(timer);
      reject(new Error(`La conexión con el servidor ${this.serverId} ha sido cerrada`));
    }
    this.pendingRequests.clear();
    
    this.connectionStatus = 'disconnected';
    console.log(`SSEMCPClient: Desconectado del servidor ${this.serverId}`);
  }

  /**
   * Lista las herramientas disponibles en el servidor
   */
  async listTools(): Promise<any[]> {
    if (this.connectionStatus !== 'connected') {
      throw new Error(`SSEMCPClient: No se puede listar herramientas. Estado de conexión: ${this.connectionStatus}`);
    }
    
    const response = await this.sendRequest('GET', 'tools');
    return response.tools || [];
  }

  /**
   * Ejecuta una herramienta en el servidor
   */
  async callTool(toolName: string, parameters: any): Promise<any> {
    if (this.connectionStatus !== 'connected') {
      throw new Error(`SSEMCPClient: No se puede ejecutar herramienta. Estado de conexión: ${this.connectionStatus}`);
    }
    
    const requestId = `req_${this.nextRequestId++}`;
    const requestData = {
      id: requestId,
      tool_name: toolName,
      parameters: parameters
    };
    
    const response = await this.sendRequest('POST', 'tool', requestData);
    return response.result;
  }

  /**
   * Envía una solicitud HTTP al servidor y espera una respuesta a través de SSE
   */
  private async sendRequest(method: string, endpoint: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${this.nextRequestId++}`;
      
      // Configurar la solicitud HTTP
      const url = `${this.baseUrl}${endpoint}`;
      const options: any = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        }
      };
      
      // Añadir API key si se proporcionó
      if (this.apiKey) {
        options.headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      // Añadir cuerpo de la solicitud para métodos POST/PUT
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify({ ...data, id: requestId });
      }
      
      // Establecer un timeout para la solicitud
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Timeout para solicitud ${requestId} al servidor ${this.serverId}`));
        }
      }, 30000); // 30 segundos de timeout
      
      // Almacenar callbacks para resolver/rechazar cuando llegue la respuesta por SSE
      this.pendingRequests.set(requestId, { resolve, reject, timer });
      
      // Enviar la solicitud HTTP
      fetch(url, options).catch((error) => {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(error);
      });
    });
  }
}
