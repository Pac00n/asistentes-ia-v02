"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  Server, 
  Settings, 
  XCircle,
  Zap 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatCard } from "../../components/StatCard";
import { MetricsChart } from "../../components/MetricsChart";

interface MCPServer {
  id: string;
  name: string;
  url: string;
  type: string;
  enabled: boolean;
  description: string;
  api_key: string;
  configuration: any;
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
  arguments?: any;
  result?: any;
  error_message?: string;
}

export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const { id } = params;
  
  const [server, setServer] = useState<MCPServer | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [executions, setExecutions] = useState<MCPExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [serverHealth, setServerHealth] = useState<'healthy' | 'unhealthy' | 'unknown'>('unknown');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Datos simulados para las gráficas (en una implementación real, estos vendrían de la API)
  const toolExecutionData = [
    {
      name: "get_weather_forecast",
      total: 120,
      successful: 115,
      failed: 5,
    },
    {
      name: "web_search",
      total: 87,
      successful: 82,
      failed: 5,
    },
    {
      name: "get_location",
      total: 45,
      successful: 44,
      failed: 1,
    },
  ];

  const timeSeriesData = [
    {
      name: "00:00",
      total: 12,
      successful: 11,
      failed: 1,
    },
    {
      name: "04:00",
      total: 8,
      successful: 7,
      failed: 1,
    },
    {
      name: "08:00",
      total: 28,
      successful: 27,
      failed: 1,
    },
    {
      name: "12:00",
      total: 31,
      successful: 30,
      failed: 1,
    },
    {
      name: "16:00",
      total: 20,
      successful: 19,
      failed: 1,
    },
    {
      name: "20:00",
      total: 15,
      successful: 14,
      failed: 1,
    },
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setIsLoading(true);
    try {
      // Cargar información del servidor
      const { data: serverData, error: serverError } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (serverError) throw serverError;
      setServer(serverData);

      // Cargar herramientas del servidor
      const { data: toolsData, error: toolsError } = await supabase
        .from('mcp_tools')
        .select('*')
        .eq('server_id', id)
        .order('created_at', { ascending: false });
      
      if (toolsError) throw toolsError;
      setTools(toolsData || []);

      // Cargar ejecuciones del servidor
      const { data: executionsData, error: executionsError } = await supabase
        .from('mcp_tool_executions')
        .select('*')
        .eq('server_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (executionsError) throw executionsError;
      setExecutions(executionsData || []);

      // Comprobar estado de salud del servidor
      await checkServerHealth(serverData);
    } catch (error) {
      console.error("Error loading server data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkServerHealth(serverData: MCPServer) {
    if (!serverData || !serverData.enabled) {
      setServerHealth('unknown');
      return;
    }

    try {
      // Simular una verificación del estado del servidor
      // En producción, esto sería una petición real
      // const response = await fetch(`${serverData.url}/health`, {
      //   headers: {
      //     'x-api-key': serverData.api_key
      //   }
      // });
      
      // if (response.ok) {
      //   const health = await response.json();
      //   setServerHealth(health.status === 'healthy' ? 'healthy' : 'unhealthy');
      // } else {
      //   setServerHealth('unhealthy');
      // }

      // Simulamos un estado aleatorio para la demo
      setServerHealth(Math.random() > 0.1 ? 'healthy' : 'unhealthy');
    } catch (error) {
      console.error("Error checking server health:", error);
      setServerHealth('unhealthy');
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }

  function getStatusColor(status: 'success' | 'error' | 'pending') {
    switch (status) {
      case 'success': return "text-green-500";
      case 'error': return "text-red-500";
      default: return "text-amber-500";
    }
  }

  function getServerHealthLabel() {
    switch (serverHealth) {
      case 'healthy': return "Operativo";
      case 'unhealthy': return "Problemas";
      default: return "Desconocido";
    }
  }

  function getServerHealthIcon() {
    switch (serverHealth) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl flex justify-center items-center h-screen">
        <div className="text-center">
          <Server className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <h2 className="text-2xl font-semibold">Cargando información del servidor...</h2>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl flex justify-center items-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-semibold">Servidor no encontrado</h2>
          <p className="mt-2 text-muted-foreground">El servidor solicitado no existe o ha sido eliminado.</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{server.name}</h1>
          <div className="flex items-center mt-1">
            <Badge variant={server.enabled ? "default" : "secondary"} className={`mr-2 ${server.enabled ? "bg-green-500" : ""}`}>
              {server.enabled ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant="outline" className="mr-2">
              {server.type.toUpperCase()}
            </Badge>
            <div className="flex items-center ml-2">
              {getServerHealthIcon()}
              <span className="ml-1.5 text-sm">{getServerHealthLabel()}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="flex items-center gap-1"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Información del Servidor</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">URL</dt>
                <dd className="mt-1">{server.url}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Tipo</dt>
                <dd className="mt-1 capitalize">{server.type}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Creado</dt>
                <dd className="mt-1">{new Date(server.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-1 flex items-center">
                  {getServerHealthIcon()}
                  <span className="ml-1.5">{getServerHealthLabel()}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <h4 className="font-medium text-muted-foreground text-sm">Descripción</h4>
              <p className="mt-1 text-sm">{server.description || "Sin descripción"}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            title="Herramientas" 
            value={tools.length} 
            icon={Zap}
            description={`${tools.filter(t => t.enabled).length} activas`}
          />
          <StatCard 
            title="Ejecuciones" 
            value={executions.length} 
            icon={Clock}
            description="Últimas 50"
          />
          <StatCard 
            title="Tasa de Éxito" 
            value={
              executions.length > 0
                ? `${((executions.filter(e => e.status === 'success').length / executions.length) * 100).toFixed(1)}%`
                : "N/A"
            }
            icon={CheckCircle}
            description={
              executions.length > 0
                ? `${executions.filter(e => e.status === 'success').length} de ${executions.length}`
                : "Sin datos"
            }
            className={
              executions.length > 0
                ? executions.filter(e => e.status === 'success').length / executions.length > 0.9
                  ? "border-green-500/50"
                  : executions.filter(e => e.status === 'success').length / executions.length > 0.8
                    ? "border-amber-500/50"
                    : "border-red-500/50"
                : ""
            }
          />
          <StatCard 
            title="Configuración" 
            value={Object.keys(server.configuration || {}).length} 
            icon={Settings}
            description="Parámetros"
          />
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tools">Herramientas</TabsTrigger>
          <TabsTrigger value="executions">Ejecuciones</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        {/* Vista de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetricsChart 
              title="Ejecuciones por Herramienta" 
              description="Total de ejecuciones por herramienta" 
              data={toolExecutionData}
            />
            <MetricsChart 
              title="Actividad por Hora" 
              description="Ejecuciones durante las últimas 24 horas" 
              data={timeSeriesData}
            />
          </div>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Herramientas Más Utilizadas</h3>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 p-4 bg-muted/50 text-sm font-medium">
              <div className="col-span-3">Nombre</div>
              <div className="col-span-4">Descripción</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-3">Estadísticas</div>
            </div>
            {tools.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay herramientas registradas para este servidor
              </div>
            ) : (
              tools.slice(0, 5).map((tool, i) => (
                <div 
                  key={tool.id} 
                  className={`grid grid-cols-12 p-4 text-sm items-center ${
                    i !== Math.min(tools.length, 5) - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="col-span-3 font-medium truncate">{tool.name}</div>
                  <div className="col-span-4 truncate">{tool.description}</div>
                  <div className="col-span-2">
                    <Badge variant={tool.enabled ? "default" : "secondary"} className={tool.enabled ? "bg-green-500" : ""}>
                      {tool.enabled ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center">
                      <span className="text-green-500 font-medium mr-2">
                        {executions.filter(e => e.tool_name === tool.name && e.status === 'success').length}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-500 font-medium mx-2">
                        {executions.filter(e => e.tool_name === tool.name && e.status === 'error').length}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-medium ml-2">
                        {executions.filter(e => e.tool_name === tool.name).length}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vista de Herramientas */}
        <TabsContent value="tools" className="space-y-4">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 p-4 bg-muted/50 text-sm font-medium">
              <div className="col-span-3">Nombre</div>
              <div className="col-span-5">Descripción</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Ejecuciones</div>
            </div>
            {tools.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay herramientas registradas para este servidor
              </div>
            ) : (
              tools.map((tool, i) => (
                <div 
                  key={tool.id} 
                  className={`grid grid-cols-12 p-4 text-sm items-center ${
                    i !== tools.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="col-span-3 font-medium truncate">{tool.name}</div>
                  <div className="col-span-5 truncate">{tool.description}</div>
                  <div className="col-span-2">
                    <Badge variant={tool.enabled ? "default" : "secondary"} className={tool.enabled ? "bg-green-500" : ""}>
                      {tool.enabled ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    {executions.filter(e => e.tool_name === tool.name).length}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vista de Ejecuciones */}
        <TabsContent value="executions" className="space-y-4">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 p-4 bg-muted/50 text-sm font-medium">
              <div className="col-span-3">ID de Llamada</div>
              <div className="col-span-2">Herramienta</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-3">Fecha</div>
              <div className="col-span-2">Acciones</div>
            </div>
            {executions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay ejecuciones registradas para este servidor
              </div>
            ) : (
              executions.map((execution, i) => (
                <div 
                  key={execution.id} 
                  className={`grid grid-cols-12 p-4 text-sm items-center ${
                    i !== executions.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="col-span-3 font-mono text-xs truncate">{execution.tool_call_id}</div>
                  <div className="col-span-2">{execution.tool_name}</div>
                  <div className="col-span-2">
                    <Badge 
                      variant={
                        execution.status === 'success' ? "default" : 
                        execution.status === 'error' ? "destructive" : 
                        "outline"
                      }
                      className={execution.status === 'success' ? "bg-green-500" : ""}>
                      {execution.status === 'success' ? "Éxito" : 
                       execution.status === 'error' ? "Error" : 
                       "Pendiente"}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-muted-foreground">
                    {new Date(execution.created_at).toLocaleString()}
                  </div>
                  <div className="col-span-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/executions/${execution.id}`}>
                        Detalles
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vista de Configuración */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Servidor</CardTitle>
              <CardDescription>
                Configuración actual y opciones del servidor MCP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Información de Conexión</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between pb-2 border-b">
                        <dt className="text-muted-foreground">URL</dt>
                        <dd className="font-mono">{server.url}</dd>
                      </div>
                      <div className="flex justify-between pb-2 border-b">
                        <dt className="text-muted-foreground">Tipo</dt>
                        <dd className="font-mono capitalize">{server.type}</dd>
                      </div>
                      <div className="flex justify-between pb-2 border-b">
                        <dt className="text-muted-foreground">API Key</dt>
                        <dd className="font-mono">
                          <code className="bg-muted px-2 py-1 rounded">
                            {server.api_key.slice(0, 4)}...{server.api_key.slice(-4)}
                          </code>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Parámetros del Servidor</h3>
                    {Object.keys(server.configuration || {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No hay parámetros de configuración disponibles
                      </p>
                    ) : (
                      <dl className="space-y-2 text-sm">
                        {Object.entries(server.configuration || {}).map(([key, value], i) => (
                          <div key={key} className="flex justify-between pb-2 border-b">
                            <dt className="text-muted-foreground">{key}</dt>
                            <dd className="font-mono">{
                              typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)
                            }</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium mb-2">Opciones Avanzadas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Estas opciones permiten configurar el comportamiento del servidor MCP
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" disabled={!server.enabled} className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Editar Configuración
                    </Button>
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reiniciar Conexión
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
