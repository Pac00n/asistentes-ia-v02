# Guía de Implementación y Uso de MCP v4

Esta guía explica cómo se ha implementado la funcionalidad de MCP v4 (Model Context Protocol versión 4) en el proyecto, y cómo configurarla y utilizarla.

## 1. Resumen de la Implementación

MCP v4 permite que el asistente de chat utilice herramientas proporcionadas por servidores externos que implementan el protocolo MCP. Los componentes principales son:

- **McpClient** (`lib/mcp/client.ts`): Cliente que descubre y ejecuta herramientas de servidores MCP externos.
- **API de MCPv4** (`app/api/chat/mcpv4/route.ts`): Endpoint que maneja las solicitudes de chat y utiliza McpClient.
- **Interfaz de Usuario** (`app/chat/mcpv4/[assistantId]/page.tsx`): Página de chat que se comunica con la API de MCPv4.

## 2. Cambios Implementados

Se han realizado los siguientes cambios para implementar MCPv4:

1. **Habilitación de llamadas HTTP reales en McpClient**:
   - Se ha modificado `discoverToolsFromServer` para realizar llamadas HTTP reales a los endpoints `/tools` de los servidores MCP.
   - Se ha modificado `executeTool` para realizar llamadas HTTP POST reales a los endpoints `/execute` de los servidores MCP.
   - Se mantiene la simulación como fallback en caso de errores de conexión, lo que facilita el desarrollo y las pruebas.

2. **Configuración de servidores MCP**:
   - Se ha añadido la variable de entorno `MCP_SERVERS_CONFIG` en `.env.local` para definir los servidores MCP externos.

## 3. Configuración

### 3.1. Configuración de Servidores MCP

Para configurar los servidores MCP externos, edita la variable `MCP_SERVERS_CONFIG` en `.env.local`:

```env
MCP_SERVERS_CONFIG='[{"id":"srv1","url":"http://localhost:3001","name":"Servidor Local 1"},{"id":"toolCo","url":"http://localhost:3002","name":"Tool Company"}]'
```

Cada servidor debe tener:
- `id`: Identificador único del servidor (se usará como prefijo para los nombres de las herramientas).
- `url`: URL base del servidor MCP.
- `name` (opcional): Nombre descriptivo del servidor.
- `apiKey` (opcional): Clave de API si el servidor requiere autenticación.

### 3.2. Estructura de los Servidores MCP

Los servidores MCP deben implementar los siguientes endpoints:

- `GET /tools`: Devuelve un array de definiciones de herramientas en formato JSON.
- `POST /execute`: Ejecuta una herramienta con los argumentos proporcionados.

#### Ejemplo de respuesta de `/tools`:
```json
[
  {
    "toolName": "calculator",
    "description": "Calculadora que evalúa expresiones matemáticas",
    "parametersSchema": {
      "type": "object",
      "properties": {
        "expression": {
          "type": "string",
          "description": "Expresión matemática a evaluar"
        }
      },
      "required": ["expression"]
    }
  }
]
```

#### Ejemplo de solicitud a `/execute`:
```json
{
  "toolName": "calculator",
  "arguments": {
    "expression": "2+2"
  }
}
```

## 4. Uso

### 4.1. Acceso a la Interfaz de Chat MCPv4

Para utilizar el chat con MCPv4, accede a la siguiente URL:

```
http://localhost:3000/chat/mcpv4/[assistantId]
```

Donde `[assistantId]` puede ser cualquier identificador, por ejemplo:
- `mcp-v4-tools`
- `test-mcp`

### 4.2. Ejemplos de Uso

Una vez en la interfaz de chat, puedes probar las herramientas con prompts como:

- Para `srv1_calculator`:
  - "Calcula 2 + 2"
  - "¿Cuánto es 100 / 4?"

- Para `srv1_weather`:
  - "¿Cuál es el clima en Madrid?"
  - "Dime la temperatura en Barcelona"

- Para `toolCo_search`:
  - "Busca información sobre inteligencia artificial"
  - "Necesito encontrar datos sobre el cambio climático"

- Para `toolCo_imageGenerator`:
  - "Genera una imagen de un gato"
  - "Crea una imagen de un paisaje montañoso"

## 5. Desarrollo y Pruebas

### 5.1. Pruebas Automatizadas

El proyecto incluye pruebas unitarias y de integración para verificar la funcionalidad de MCPv4:

```bash
# Pruebas unitarias para McpClient
npx jest tests/unit/mcpClient.test.ts

# Pruebas de integración para la API de MCPv4
npx jest tests/integration/mcpv4Api.test.ts
```

### 5.2. Modo de Desarrollo

Durante el desarrollo, si los servidores MCP externos no están disponibles, McpClient utilizará automáticamente la simulación como fallback. Esto permite probar la funcionalidad sin necesidad de tener servidores MCP reales.

## 6. Consideraciones para Producción

Antes de desplegar en producción, considera:

1. **Gestión de Errores**: Implementar una estrategia más robusta para manejar errores de conexión, timeouts, etc.
2. **Seguridad**: Asegurar que las claves de API se almacenan de forma segura y que las comunicaciones con los servidores MCP son seguras (HTTPS).
3. **Monitorización**: Añadir logging y monitorización para detectar problemas con los servidores MCP.
4. **Caché**: Considerar implementar un caché para las definiciones de herramientas para mejorar el rendimiento.
5. **Validación**: Validar y sanitizar los datos recibidos de los servidores MCP antes de utilizarlos.