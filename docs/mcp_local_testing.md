# Documentación para Pruebas Locales del Sistema MCP

## Introducción

Este documento proporciona instrucciones sobre cómo configurar y ejecutar localmente el sistema de Protocolo de Contexto de Modelo (MCP) para pruebas. El sistema consta de varios componentes que deben ejecutarse simultáneamente para permitir que los asistentes de IA accedan a herramientas externas como consultas de clima y búsquedas web.

## Componentes del Sistema

El sistema MCP completo incluye los siguientes componentes:

1. **Aplicación Principal (Next.js)**: Aloja la interfaz de usuario web, el dashboard y gestiona la comunicación con los modelos de OpenAI.

2. **Servidores MCP**:
   - **Servidor de Clima**: Proporciona pronósticos del clima para diferentes ubicaciones.
   - **Servidor de Búsqueda Web**: Permite realizar búsquedas de información en la web.

3. **Base de Datos (Supabase)**: Almacena la configuración de los servidores MCP, herramientas disponibles, y registros de ejecución.

## Requisitos Previos

Para ejecutar el sistema localmente, necesitas:

- Node.js v18+ instalado
- Una cuenta de Supabase con una base de datos configurada
- Una clave API de OpenAI
- Git para clonar el repositorio

## Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <repo_url>
cd asistentes-ia-v02
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```
# OpenAI API Key
OPENAI_API_KEY=sk-tu-clave-de-api-aqui

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-aqui

# Configuración MCP - Modo de desarrollo
NEXT_PUBLIC_MCP_DEV_MODE=true
```

### 4. Preparar la Base de Datos

Para configurar correctamente la base de datos en Supabase para el sistema MCP, es necesario ejecutar varios scripts SQL para crear tablas y registrar los servidores MCP y sus herramientas. Se recomiendan los scripts "fix" o "upsert" que controlan duplicaciones.

## Ejecución del Sistema

Para ejecutar el sistema completo, necesitas iniciar varios componentes en paralelo:

### 1. Iniciar la Aplicación Principal

```bash
npm run dev
```

Esto iniciará la aplicación Next.js en http://localhost:3000.

### 2. Iniciar el Servidor de Clima

```bash
cd examples/mcp_servers/weather_service
node sse_server.js
```

El servidor de clima se iniciará en http://localhost:3456.

### 3. Iniciar el Servidor de Búsqueda Web

```bash
cd examples/mcp_servers/web_search_service
node server.js
```

El servidor de búsqueda web se iniciará en http://localhost:3458.

## Problemas Comunes y Soluciones

Durante nuestras pruebas, hemos encontrado y resuelto los siguientes problemas:

### 1. Error de Configuración de Servidores MCP en Supabase

**Síntoma:** Error `MCPClientFactory: Falta información de conexión (params.url) para servidor SSE xxxxxx`

**Causa:** Los servidores SSE en Supabase requieren que la URL se especifique en el campo `params` de la tabla `mcp_servers`, pero a veces este campo no se configura correctamente.

**Solución:** Ejecutar un script SQL para actualizar los parámetros del servidor:

```sql
UPDATE mcp_servers 
SET params = jsonb_build_object(
    'url', 'http://localhost:3458',  -- URL del servidor SSE (ajustar según el servidor)
    'cache_duration_seconds', 3600,  -- Otros parámetros según sea necesario
    'timeout_seconds', 15
)
WHERE name = 'Nombre del Servidor';
```

### 2. Problemas con la Navegación del Dashboard

**Síntoma:** El botón para acceder al dashboard no funciona correctamente.

**Causa:** Problemas con el manejo de eventos en los componentes de Next.js.

**Solución:** Modificar el componente de navegación para usar enlaces HTML directos:

```jsx
// En DashboardNav.tsx
<a 
  href="/dashboard"
  className={/* clases CSS */}
>
  <Icon className="mr-2 h-4 w-4" />
  Dashboard MCP
</a>
```

### 3. El Servicio de Búsqueda Web no Aparece en las Herramientas Disponibles

**Síntoma:** Al hacer preguntas que deberían usar el servicio de búsqueda web, solo se utiliza el servicio de clima.

**Causa:** El servidor de búsqueda web no está correctamente registrado en Supabase o no está configurado con los parámetros necesarios.

**Solución:** Verificar y actualizar el registro del servidor y sus herramientas en Supabase usando los scripts SQL proporcionados en `/examples/mcp_servers/web_search_service/`.

## Verificación del Sistema

Para verificar que el sistema funciona correctamente:

1. **Acceder al Dashboard**: Navega a http://localhost:3000/dashboard para verificar que puedes ver las métricas de los servidores.

2. **Prueba del Servicio de Clima**: Pregunta al asistente "¿Qué tiempo hace en Madrid?" y verifica que proporcione información del clima.

3. **Prueba del Servicio de Búsqueda**: Pregunta al asistente "¿Qué pasó ayer en Madrid?" y verifica que proporcione resultados de búsqueda.

## Notas Adicionales

- El sistema está en modo de desarrollo (`NEXT_PUBLIC_MCP_DEV_MODE=true`), lo que significa que se otorgan consentimientos automáticamente para el uso de herramientas.
- Los servidores MCP de demostración proporcionan datos simulados, no datos reales.
- Para depurar problemas, revisa los logs en las terminales donde se ejecutan los servidores, ya que proporcionan información detallada sobre las peticiones y respuestas.

## Estructura del Código Relevante

Los archivos clave para entender y modificar el sistema MCP incluyen:

- `/lib/mcp_adapter.ts`: Adaptador principal que conecta con los servidores MCP.
- `/lib/mcp_clients/`: Implementaciones de clientes para diferentes tipos de servidores MCP.
- `/app/api/chat/route.ts`: Endpoint API que integra OpenAI con el adaptador MCP.
- `/app/dashboard/`: Implementación del dashboard para monitorear servidores MCP.
- `/examples/mcp_servers/`: Implementaciones de ejemplo de servidores MCP.

---

Esta documentación se actualizó el 17 de mayo de 2025 y refleja el estado actual de implementación del sistema MCP.
