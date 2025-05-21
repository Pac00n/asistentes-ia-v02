# Resumen Técnico y Guía de Pruebas: Chat MCP v4

Este documento proporciona un resumen de la funcionalidad "Chat MCP v4", cómo probarla en un entorno de desarrollo y consideraciones importantes antes de su despliegue en producción.

## 1. Resumen de la Funcionalidad Implementada

El "Chat MCP v4" extiende las capacidades del chat existente permitiendo la integración con **servidores MCP (Model Context Protocol) externos**. Esto significa que el asistente puede utilizar herramientas y capacidades ofrecidas por estos servidores remotos, en lugar de depender únicamente de herramientas definidas localmente.

Los componentes clave de esta implementación son:

*   **Nueva Ruta API (`/api/chat/mcpv4`):** Un endpoint de backend dedicado que maneja la lógica del chat v4, interactuando con el `McpClient`.
*   **Nueva Interfaz de Usuario (UI) (`/chat/mcpv4/[assistantId]`):** Una nueva página de chat (basada en la UI de v3) que se comunica con la API v4.
*   **Cliente MCP (`lib/mcp/client.ts`):** El corazón de la nueva funcionalidad. Es responsable de:
    *   Descubrir herramientas de los servidores MCP configurados.
    *   Traducir estas herramientas al formato que OpenAI espera.
    *   Prefijar los nombres de las herramientas con el ID del servidor (ej. `srv1_calculator`) para el enrutamiento.
    *   Despachar las solicitudes de ejecución de herramientas de OpenAI al servidor MCP correspondiente.
    *   **Importante:** Actualmente, las llamadas HTTP a los servidores MCP externos están **simuladas**.
*   **Configuración (`MCP_SERVERS_CONFIG`):** Se utiliza una variable de entorno para definir la lista de servidores MCP externos a los que el `McpClient` intentará conectarse.

## 2. Cómo Probar en un Entorno de Desarrollo

### 2.1. Configuración de `MCP_SERVERS_CONFIG`

Para que `McpClient` "descubra" y "ejecute" las herramientas simuladas, necesitas definir la variable de entorno `MCP_SERVERS_CONFIG`.

1.  Crea un archivo `.env.local` en la raíz de tu proyecto si aún no existe.
2.  Añade la siguiente línea al archivo `.env.local`:

    ```env
    MCP_SERVERS_CONFIG='[{"id": "srv1", "url": "http://simulado1.com", "name": "Servidor Simulado 1"}, {"id": "toolCo", "url": "http://simulado2.com", "name": "Tool Company Simulada"}]'
    ```
    *   **Nota:** Las `url` pueden ser ficticias ya que las llamadas HTTP son simuladas. Los `id` ("srv1", "toolCo") son importantes porque la simulación interna en `McpClient.ts` los usa para devolver diferentes conjuntos de herramientas y resultados.

### 2.2. Ejecución de Pruebas Automatizadas

El proyecto incluye pruebas unitarias y de integración para verificar la funcionalidad del `McpClient` y la API `mcpv4`.

*   **Pruebas Unitarias (para `McpClient`):**
    ```bash
    npm run test:unit
    # o directamente:
    # npx jest tests/unit/mcpClient.test.ts
    ```
*   **Pruebas de Integración (para la API `/api/chat/mcpv4`):**
    ```bash
    npx jest tests/integration/mcpv4Api.test.ts
    ```
    Asegúrate de tener `MCP_SERVERS_CONFIG` definida en tu entorno (o que los mocks en las pruebas sean suficientes) para que estas pruebas pasen correctamente.

### 2.3. Prueba Manual de la Interfaz de Usuario

1.  Inicia el servidor de desarrollo (ej. `npm run dev`).
2.  Navega en tu navegador a la URL de la nueva interfaz de Chat MCP v4. Por ejemplo, si usas un ID de asistente como "test-mcp":
    `http://localhost:3000/chat/mcpv4/test-mcp`
    (Reemplaza `test-mcp` con un ID de asistente válido o la lógica que uses para acceder a esta página).
3.  Una vez en la interfaz, puedes probar las herramientas simuladas con prompts como:
    *   Para `srv1_calculator` (simulado desde `srv1`):
        *   "Calcula 2 + 2"
        *   "Cuánto es 100 / 4"
    *   Para `toolCo_search` (simulado desde `toolCo`):
        *   "Busca información sobre inteligencia artificial"
        *   "Qué es el Model Context Protocol"
    *   Para `toolCo_imageGenerator` (simulado desde `toolCo`):
        *   "Genera una imagen de un gato"
4.  Observa las respuestas y si el asistente indica que está usando una herramienta. Los resultados serán los simulados en `McpClient.ts`.

## 3. Consideraciones Antes de Poner en Producción

La implementación actual de "Chat MCP v4" con `McpClient` es una base funcional, pero **requiere trabajo adicional significativo** antes de ser considerada para un entorno de producción.

*   **1. Implementación de Llamadas HTTP Reales (Crítico):**
    *   **El paso más importante.** Actualmente, `McpClient.ts` **simula** las llamadas de red para descubrir y ejecutar herramientas.
    *   Debes modificar los métodos `discoverToolsFromServer` y `executeTool` en `lib/mcp/client.ts`.
    *   Descomenta y adapta las secciones de código que usan `fetch` (o reemplázalas con `axios` si lo prefieres) para realizar llamadas HTTP reales a los servidores MCP.

*   **2. Pruebas Exhaustivas con Servidores MCP Reales:**
    *   Una vez implementadas las llamadas HTTP, es crucial probar la integración con servidores MCP reales y funcionales.
    *   Verifica que el descubrimiento de herramientas y la ejecución funcionen como se espera con las especificaciones reales de esos servidores.

*   **3. Gestión Segura de `apiKey`:**
    *   Si los servidores MCP reales requieren claves de API, asegúrate de que estas se almacenen y transmitan de forma segura. Utiliza variables de entorno en producción y nunca las hardcodees en el código fuente.

*   **4. Manejo de Errores y Resiliencia de Red:**
    *   Implementa un manejo de errores más robusto para las llamadas de red: timeouts, reintentos (con backoff exponencial si es apropiado), errores de conexión, respuestas HTTP inesperadas (ej. 4xx, 5xx), etc.
    *   Considera el uso de librerías como `axios-retry` si usas Axios.

*   **5. Estrategia de Inicialización del `McpClient`:**
    *   La inicialización actual de `McpClient` (incluyendo el descubrimiento de herramientas) ocurre por solicitud en la ruta API. Si el descubrimiento de herramientas desde servidores reales es lento, esto podría impactar el rendimiento.
    *   Considera inicializar el `McpClient` (y descubrir herramientas) una vez al arrancar el servidor de la aplicación y luego reutilizar esa instancia (patrón singleton o similar). Esto podría requerir un caché para las definiciones de herramientas si cambian dinámicamente.

*   **6. Logging y Monitorización:**
    *   Añade logging más detallado para todas las interacciones con los servidores MCP externos (solicitudes, respuestas, errores).
    *   Configura monitorización para detectar fallos o latencias en las comunicaciones con los servidores MCP.

*   **7. Especificación MCP:**
    *   Asegúrate de que tu implementación del cliente MCP sea compatible con la versión específica del protocolo MCP que usan los servidores externos a los que te conectarás. La simulación actual hace suposiciones sobre los endpoints (`/tools`, `/executeTool`) y formatos.

*   **8. Seguridad Adicional:**
    *   Valida y sanitiza cualquier dato proveniente de servidores MCP externos antes de usarlo internamente o mostrarlo a los usuarios, si aplica.

Abordar estas consideraciones es esencial para asegurar una transición exitosa de la funcionalidad actual (basada en simulación) a un sistema robusto y fiable en producción.
