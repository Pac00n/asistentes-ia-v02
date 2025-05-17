'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ConsentManager({ userId }: { userId: string }) {
  const [loading] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <h2 className="font-bold">Estado de desarrollo</h2>
        <p className="mt-2">
          El gestor de consentimientos MCP está en desarrollo. En esta fase de implementación, 
          todos los permisos se otorgan automáticamente a las herramientas MCP para facilitar las pruebas.
        </p>
        <p className="mt-2">
          En la próxima actualización, podrás controlar qué herramientas específicas tienen permiso para acceder a tus datos.
        </p>
      </div>

      <h1 className="text-2xl font-bold mb-4">Gestión de Consentimientos MCP</h1>
      <p className="text-gray-600 mb-6">
        Las herramientas MCP (Model Context Protocol) permiten a los asistentes de IA acceder a datos 
        y realizar acciones como consultar el clima, buscar información o conectarse a otros servicios.
      </p>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <h3 className="font-semibold text-blue-700">Configuración actual</h3>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Servicio de pronóstico del tiempo: <strong>Permitido</strong></span>
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Herramienta de búsqueda: <strong>Permitido</strong></span>
          </li>
        </ul>
      </div>

      <div className="mt-8">
        <div className="text-center">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Actualizar preferencias'}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Esta función estará disponible en la próxima actualización.
          </p>
        </div>
      </div>
    </div>
  );
}
