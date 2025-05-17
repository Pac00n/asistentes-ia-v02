"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, ArrowUpDown, CheckCircle, Clock, Database, RefreshCw, Server, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: string;
  enabled: boolean;
  description: string;
  created_at: string;
}

interface MCPTool {
  id: string;
  name: string;
  server_id: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

interface MCPExecution {
  id: string;
  tool_call_id: string;
  server_id: string;
  tool_name: string;
  status: 'success' | 'error' | 'pending';
  created_at: string;
}

interface MCPServerMetrics {
  uptime: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  lastRequestTime: string | null;
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [executions, setExecutions] = useState<MCPExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [serverMetrics, setServerMetrics] = useState<Record<string, MCPServerMetrics | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // Cargar servidores
      const { data: serversData, error: serversError } = await supabase
        .from('mcp_servers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (serversError) throw serversError;
      setServers(serversData || []);

      // Cargar herramientas
      const { data: toolsData, error: toolsError } = await supabase
        .from('mcp_tools')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (toolsError) throw toolsError;
      setTools(toolsData || []);

      // Cargar ejecuciones
      const { data: executionsData, error: executionsError } = await supabase
        .from('mcp_tool_executions')
        .select('id, tool_call_id, server_id, tool_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (executionsError) throw executionsError;
      setExecutions(executionsData || []);

      // Cargar métricas de los servidores
      await loadServerMetrics(serversData || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadServerMetrics(servers: MCPServer[]) {
    const metricsObj: Record<string, MCPServerMetrics | null> = {};
    
    for (const server of servers) {
      if (!server.enabled) {
        metricsObj[server.id] = null;
        continue;
      }
      
      try {
        // Simular carga de métricas del servidor MCP
        // En producción, esto sería una llamada real a la API del servidor
        // const response = await fetch(`${server.url}/metrics`, {
        //   headers: {
        //     'x-api-key': 'YOUR_API_KEY'  // En producción, obtener de forma segura
        //   }
        // });
        // const data = await response.json();
        
        // Datos simulados por ahora
        metricsObj[server.id] = {
          uptime: Math.floor(Math.random() * 86400), // Hasta 24 horas en segundos
          requestCount: Math.floor(Math.random() * 1000),
          successCount: Math.floor(Math.random() * 800),
          errorCount: Math.floor(Math.random() * 50),
          lastRequestTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString()
        };
      } catch (error) {
        console.error(`Error fetching metrics for server ${server.name}:`, error);
        metricsObj[server.id] = null;
      }
    }
    
    setServerMetrics(metricsObj);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  }

  function getServerById(id: string): MCPServer | undefined {
    return servers.find(server => server.id === id);
  }

  function getServerToolsCount(serverId: string): number {
    return tools.filter(tool => tool.server_id === serverId).length;
  }

  function getExecutionRateColor(successRate: number): string {
    if (successRate >= 95) return "text-green-500";
    if (successRate >= 80) return "text-yellow-500";
    return "text-red-500";
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard MCP</h1>
          <p className="text-muted-foreground">Monitorización de servidores y herramientas MCP</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="flex items-center gap-1"
          disabled={refreshing || isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      <Tabs 
        defaultValue="overview" 
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="servers">Servidores</TabsTrigger>
          <TabsTrigger value="tools">Herramientas</TabsTrigger>
          <TabsTrigger value="executions">Ejecuciones</TabsTrigger>
        </TabsList>

        {/* Vista de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Servidores Totales</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {servers.filter(s => s.enabled).length} activos
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Herramientas MCP</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tools.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tools.filter(t => t.enabled).length} activas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ejecuciones Recientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimas 100 ejecuciones
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {executions.length > 0 ? (
                  <>
                    <div className={`text-2xl font-bold ${
                      getExecutionRateColor(
                        (executions.filter(e => e.status === 'success').length / executions.length) * 100
                      )
                    }`}>
                      {((executions.filter(e => e.status === 'success').length / executions.length) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {executions.filter(e => e.status === 'success').length} exitosas / {executions.length} totales
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold">-</div>
                )}
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-3">Estado de los Servidores</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers.map(server => (
              <Card key={server.id} className={`${!server.enabled ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium">{server.name}</CardTitle>
                    <Badge variant={server.enabled ? "default" : "secondary"}>
                      {server.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-1">{server.url}</CardDescription>
                </CardHeader>
                <CardContent>
                  {server.enabled && serverMetrics[server.id] ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tiempo activo:</span>
                        <span>{formatUptime(serverMetrics[server.id]?.uptime || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Peticiones:</span>
                        <span>{serverMetrics[server.id]?.requestCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tasa de éxito:</span>
                        <span className={getExecutionRateColor(
                          serverMetrics[server.id]?.requestCount 
                            ? (serverMetrics[server.id]?.successCount || 0) / (serverMetrics[server.id]?.requestCount || 1) * 100 
                            : 100
                        )}>
                          {serverMetrics[server.id]?.requestCount 
                            ? ((serverMetrics[server.id]?.successCount || 0) / (serverMetrics[server.id]?.requestCount || 1) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Herramientas:</span>
                        <span>{getServerToolsCount(server.id)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-sm text-muted-foreground italic text-center">
                      {server.enabled 
                        ? "Métricas no disponibles" 
                        : "Servidor inactivo"}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vista de Servidores */}
        <TabsContent value="servers" className="space-y-4">
          <div className="rounded-md border">
            <div className="grid grid-cols-8 p-4 bg-muted/50 text-sm font-medium">
              <div className="col-span-2">Nombre</div>
              <div className="col-span-2">URL</div>
              <div className="col-span-1">Tipo</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1">Herramientas</div>
              <div className="col-span-1">Acciones</div>
            </div>
            {servers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay servidores registrados
              </div>
            ) : (
              servers.map((server, i) => (
                <div 
                  key={server.id} 
                  className={`grid grid-cols-8 p-4 text-sm items-center ${
                    i !== servers.length - 1 ? "border-b" : ""
                  } ${
                    !server.enabled ? "bg-muted/20" : ""
                  }`}
                >
                  <div className="col-span-2 font-medium">{server.name}</div>
                  <div className="col-span-2 truncate">{server.url}</div>
                  <div className="col-span-1">
                    <Badge variant="outline">{server.type}</Badge>
                  </div>
                  <div className="col-span-1">
                    <Badge variant={server.enabled ? "default" : "secondary"} className={server.enabled ? "bg-green-500" : ""}>
                      {server.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="col-span-1">{getServerToolsCount(server.id)}</div>
                  <div className="col-span-1">
                    <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                      <Link href={`/dashboard/servers/${server.id}`}>
                        <span className="sr-only">Detalles</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vista de Herramientas */}
        <TabsContent value="tools" className="space-y-4">
          <div className="rounded-md border">
            <div className="grid grid-cols-8 p-4 bg-muted/50 text-sm font-medium">
              <div className="col-span-2">Nombre</div>
              <div className="col-span-2">Servidor</div>
              <div className="col-span-2">Descripción</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1">Acciones</div>
            </div>
            {tools.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay herramientas registradas
              </div>
            ) : (
              tools.map((tool, i) => {
                const server = getServerById(tool.server_id);
                return (
                  <div 
                    key={tool.id} 
                    className={`grid grid-cols-8 p-4 text-sm items-center ${
                      i !== tools.length - 1 ? "border-b" : ""
                    } ${
                      !tool.enabled || !server?.enabled ? "bg-muted/20" : ""
                    }`}
                  >
                    <div className="col-span-2 font-medium">{tool.name}</div>
                    <div className="col-span-2 truncate">{server?.name || 'Servidor desconocido'}</div>
                    <div className="col-span-2 truncate">{tool.description}</div>
                    <div className="col-span-1">
                      <Badge variant={tool.enabled && server?.enabled ? "default" : "secondary"} className={tool.enabled && server?.enabled ? "bg-green-500" : ""}>
                        {tool.enabled && server?.enabled ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                        <Link href={`/dashboard/tools/${tool.id}`}>
                          <span className="sr-only">Detalles</span>
                          <ArrowUpDown className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Vista de Ejecuciones */}
        <TabsContent value="executions" className="space-y-4">
          <div className="rounded-md border">
            <div className="grid grid-cols-10 p-4 bg-muted/50 text-sm font-medium">
              <div className="col-span-3">ID de Llamada</div>
              <div className="col-span-2">Herramienta</div>
              <div className="col-span-2">Servidor</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-2">Fecha</div>
            </div>
            {executions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay ejecuciones registradas
              </div>
            ) : (
              executions.map((execution, i) => {
                const server = getServerById(execution.server_id);
                return (
                  <div 
                    key={execution.id} 
                    className={`grid grid-cols-10 p-4 text-sm items-center ${
                      i !== executions.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="col-span-3 font-mono text-xs truncate">{execution.tool_call_id}</div>
                    <div className="col-span-2">{execution.tool_name}</div>
                    <div className="col-span-2 truncate">{server?.name || 'Servidor desconocido'}</div>
                    <div className="col-span-1">
                      <Badge 
                        variant={
                          execution.status === 'success' ? "default" : 
                          execution.status === 'error' ? "destructive" : 
                          "outline"
                        }
                        className={execution.status === 'success' ? "bg-green-500" : ""}
                      >
                        {execution.status === 'success' ? "Éxito" : 
                         execution.status === 'error' ? "Error" : 
                         "Pendiente"}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {new Date(execution.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
