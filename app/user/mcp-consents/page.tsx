'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';

interface ConsentItem {
  id: string;
  user_identifier: string;
  server_id: string;
  tool_name: string;
  assistant_id: string;
  has_consent: boolean;
  created_at: string;
  updated_at: string;
  // Join data
  mcp_servers?: {
    name: string;
    type: string;
  };
  mcp_tools?: {
    name: string;
    description: string;
  };
}

interface ServerInfo {
  id: string;
  name: string;
  type: string;
  tools: {
    id: string;
    name: string;
    description: string;
  }[];
}

export default function MCPConsentsPage() {
  const { user } = useUser();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadConsents();
      loadServersAndTools();
    }
  }, [user]);

  async function loadConsents() {
    if (!user?.id) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('mcp_user_consents')
      .select(`
        *,
        mcp_servers (
          name,
          type
        ),
        mcp_tools (
          name,
          description
        )
      `)
      .eq('user_identifier', user.id);
    
    if (error) {
      console.error('Error loading consents:', error);
      toast({
        title: 'Error al cargar consentimientos',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setConsents(data || []);
    }
    
    setIsLoading(false);
  }

  async function loadServersAndTools() {
    const { data: serversData, error: serversError } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('active', true);
    
    if (serversError) {
      console.error('Error loading servers:', serversError);
      return;
    }
    
    const serversWithTools: ServerInfo[] = [];
    
    for (const server of serversData || []) {
      const { data: toolsData } = await supabase
        .from('mcp_tools')
        .select('*')
        .eq('server_id', server.id);
      
      serversWithTools.push({
        id: server.id,
        name: server.name,
        type: server.type,
        tools: toolsData || []
      });
    }
    
    setServers(serversWithTools);
  }

  async function updateConsent(consentItem: ConsentItem, newValue: boolean) {
    if (!user?.id) return;
    setIsUpdating(true);
    
    // Si el consentimiento ya existe, actualizamos
    if (consentItem.id) {
      const { error } = await supabase
        .from('mcp_user_consents')
        .update({ has_consent: newValue, updated_at: new Date().toISOString() })
        .eq('id', consentItem.id);
      
      if (error) {
        console.error('Error updating consent:', error);
        toast({
          title: 'Error al actualizar consentimiento',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Consentimiento actualizado',
          description: `Se ha ${newValue ? 'otorgado' : 'revocado'} el consentimiento para la herramienta "${consentItem.tool_name}"`,
        });
        
        // Actualizar la UI
        setConsents(consents.map(c => 
          c.id === consentItem.id 
            ? { ...c, has_consent: newValue } 
            : c
        ));
      }
    } else {
      // Si no existe, creamos nuevo registro
      const newConsent = {
        user_identifier: user.id,
        server_id: consentItem.server_id,
        tool_name: consentItem.tool_name,
        assistant_id: consentItem.assistant_id,
        has_consent: newValue
      };
      
      const { error, data } = await supabase
        .from('mcp_user_consents')
        .insert(newConsent)
        .select();
      
      if (error) {
        console.error('Error creating consent:', error);
        toast({
          title: 'Error al crear consentimiento',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Consentimiento creado',
          description: `Se ha ${newValue ? 'otorgado' : 'denegado'} el consentimiento para la herramienta "${consentItem.tool_name}"`,
        });
        
        // Actualizar la UI
        setConsents([...consents, data?.[0]]);
      }
    }
    
    setIsUpdating(false);
  }

  function getServerName(serverId: string) {
    const server = servers.find(s => s.id === serverId);
    return server?.name || 'Servidor desconocido';
  }

  function getToolDescription(serverId: string, toolName: string) {
    const server = servers.find(s => s.id === serverId);
    const tool = server?.tools.find(t => t.name === toolName);
    return tool?.description || 'Sin descripción';
  }

  if (!user) {
    return (
      <div className="container max-w-3xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Consentimientos MCP</CardTitle>
            <CardDescription>
              Debes iniciar sesión para gestionar tus consentimientos.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login">
              <Button>Iniciar sesión</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <div className="flex items-center mb-6">
        <Link href="/user/settings" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Gestión de Consentimientos MCP</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>¿Qué son los consentimientos MCP?</CardTitle>
          <CardDescription>
            Los consentimientos MCP permiten que los asistentes de IA utilicen herramientas externas para proporcionar información o realizar acciones por ti.
            Puedes controlar qué herramientas pueden utilizar los asistentes activando o desactivando los consentimientos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start p-4 bg-amber-50 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
            <p className="text-sm text-amber-800">
              Al activar un consentimiento, estás permitiendo que un asistente utilice la herramienta correspondiente para procesar tus datos.
              Revisa cuidadosamente las descripciones de las herramientas antes de otorgar consentimiento.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">Tus consentimientos</h2>
      
      {isLoading ? (
        <p>Cargando consentimientos...</p>
      ) : consents.length === 0 ? (
        <p className="text-muted-foreground">No has otorgado consentimientos aún.</p>
      ) : (
        <div className="space-y-4">
          {consents.map((consent) => (
            <Card key={consent.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    {consent.tool_name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`consent-${consent.id}`} className="text-sm text-muted-foreground">
                      {consent.has_consent ? 'Permitido' : 'Denegado'}
                    </Label>
                    <Switch
                      id={`consent-${consent.id}`}
                      checked={consent.has_consent}
                      onCheckedChange={(checked) => updateConsent(consent, checked)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
                <CardDescription>
                  {getToolDescription(consent.server_id, consent.tool_name)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm">
                  <p><span className="font-medium">Servidor:</span> {getServerName(consent.server_id)}</p>
                  <p><span className="font-medium">Asistente:</span> {consent.assistant_id}</p>
                  {consent.has_consent && (
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      <span>Consentimiento activo</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <h2 className="text-xl font-semibold mt-8 mb-4">Herramientas disponibles</h2>
      
      {servers.length === 0 ? (
        <p className="text-muted-foreground">No hay servidores MCP disponibles.</p>
      ) : (
        <div className="space-y-6">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <CardTitle>{server.name}</CardTitle>
                <CardDescription>Tipo: {server.type}</CardDescription>
              </CardHeader>
              <CardContent>
                {server.tools.length === 0 ? (
                  <p className="text-muted-foreground">Este servidor no tiene herramientas disponibles.</p>
                ) : (
                  <div className="space-y-4">
                    {server.tools.map((tool) => {
                      const existingConsent = consents.find(
                        c => c.server_id === server.id && c.tool_name === tool.name
                      );
                      
                      return (
                        <div key={tool.id} className="border p-4 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{tool.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`tool-${tool.id}`} className="text-sm text-muted-foreground">
                                {existingConsent?.has_consent ? 'Permitido' : 'Denegado'}
                              </Label>
                              <Switch
                                id={`tool-${tool.id}`}
                                checked={existingConsent?.has_consent || false}
                                onCheckedChange={(checked) => updateConsent({
                                  id: existingConsent?.id || '',
                                  user_identifier: user.id,
                                  server_id: server.id,
                                  tool_name: tool.name,
                                  assistant_id: 'global', // Consentimiento global para todos los asistentes
                                  has_consent: checked,
                                  created_at: existingConsent?.created_at || new Date().toISOString(),
                                  updated_at: existingConsent?.updated_at || new Date().toISOString()
                                }, checked)}
                                disabled={isUpdating}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
