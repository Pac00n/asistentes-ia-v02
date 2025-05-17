'use client';

import ConsentManager from '@/components/ConsentManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ConsentSettingsPage() {
  // Usando un ID fijo para demostración
  const userId = 'default-user';

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Configuración de Privacidad</h1>
      
      <Tabs defaultValue="mcp_consents" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="mcp_consents">Consentimientos MCP</TabsTrigger>
          <TabsTrigger value="privacy_settings">Configuración General</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mcp_consents">
          <Card>
            <CardHeader>
              <CardTitle>Permisos de Herramientas MCP</CardTitle>
              <CardDescription>
                Controla qué herramientas pueden utilizar los asistentes de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle>Acerca de los Permisos MCP</AlertTitle>
                <AlertDescription>
                  Los asistentes de IA pueden utilizar herramientas externas (MCP) para realizar tareas como consultar el clima, 
                  buscar información o acceder a datos. Aquí puedes elegir qué herramientas tienen permiso para usar.
                </AlertDescription>
              </Alert>
              
              <ConsentManager userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy_settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Privacidad General</CardTitle>
              <CardDescription>
                Ajusta cómo se manejan tus datos e información
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-10">
                La configuración adicional de privacidad estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
