# Implementación de Herramienta MCP de Búsqueda Web

**Fecha:** 17 de mayo de 2025  
**Autor:** Equipo de Desarrollo

## Resumen

Se ha implementado una nueva herramienta MCP (Model Context Protocol) que proporciona capacidades de búsqueda web a los asistentes de IA. Esta herramienta utiliza el protocolo SSE (Server-Sent Events) para la comunicación, siguiendo el mismo patrón que el servicio de clima implementado anteriormente.

## Componentes Implementados

### 1. Servidor MCP SSE de Búsqueda Web
- ✅ **Implementado y funcional** en puerto 3458
- Proporciona la herramienta `web_search` para realizar búsquedas en internet
- Implementa comunicación basada en SSE para mayor fiabilidad
- Incluye autenticación mediante API key
- Incorpora limitación de tasas para prevenir abusos

### 2. Estructura del Proyecto
```
examples/mcp_servers/web_search_service/
├── server.js           # Implementación principal del servidor
├── start-server.js     # Script de inicio con carga de variables de entorno
├── package.json        # Configuración de dependencias
├── register_server.sql # SQL para registrar el servicio en Supabase
└── README.md           # Documentación de uso
```

### 3. Características de la Herramienta
- **Nombre:** `web_search`
- **Descripción:** Busca información en la web utilizando un motor de búsqueda
- **Parámetros:**
  - `query` (string, requerido): La consulta de búsqueda que se desea realizar
  - `num_results` (number, opcional): Número de resultados a devolver (máximo 10, por defecto 5)
- **Resultado:** Objeto JSON con los resultados de la búsqueda, incluyendo títulos, URLs y fragmentos

## Implementación Técnica

### Endpoints del Servidor
- `GET /health`: Estado de salud del servidor
- `GET /metrics`: Métricas de uso (peticiones, éxitos, errores)
- `GET /tools`: Lista de herramientas disponibles
- `POST /execute`: Ejecuta la herramienta de búsqueda

### Flujo de Comunicación SSE
1. El cliente realiza una petición POST a `/execute`
2. El servidor envía un evento `tool_call_start`
3. El servidor procesa la búsqueda
4. El servidor envía un evento `tool_call_end` con los resultados o error
5. La conexión SSE se cierra

### Simulación de Búsqueda
- La implementación actual simula resultados de búsqueda para propósitos de demostración
- En un entorno de producción, se integraría con una API real como Google Custom Search, Bing, etc.

## Integración con el Sistema MCP

### Registro en Base de Datos
Se ha preparado un script SQL (`register_server.sql`) para:
- Registrar el servidor en la tabla `mcp_servers`
- Registrar la herramienta en la tabla `mcp_tools`
- Configurar los parámetros necesarios para su funcionamiento

### Acceso desde los Asistentes
- El adaptador MCP detectará automáticamente la nueva herramienta
- Los asistentes podrán utilizarla cuando hagan preguntas que requieran búsqueda de información

## Gestión de Consentimientos

La herramienta de búsqueda web se integra con el sistema de gestión de consentimientos:
- Los usuarios pueden ver y controlar el acceso desde la página `/settings/consents`
- Se requiere consentimiento explícito antes de ejecutar búsquedas
- El adaptador MCP verifica los permisos antes de cada ejecución

## Seguridad y Rendimiento

### Medidas de Seguridad
- Autenticación mediante API key
- Limitación de tasas (100 peticiones por 15 minutos)
- Validación de parámetros de entrada

### Optimización de Rendimiento
- Tiempos de respuesta rápidos (simulados para demo)
- Límite configurable de resultados
- Formato de respuesta optimizado para su uso por asistentes IA

## Próximos Pasos

### Mejoras Planificadas
1. **Integración con API real de búsqueda**:
   - Implementar conexión con Google Custom Search API o alternativa
   - Añadir filtros para personalizar resultados

2. **Mejoras de Seguridad**:
   - Rotación automática de API keys
   - Políticas CORS más restrictivas
   - Auditoría detallada de uso

3. **Extensiones Funcionales**:
   - Búsqueda de imágenes
   - Búsqueda de noticias recientes
   - Filtrado por fecha o sitio web

## Pruebas

### Pruebas Manuales
Se pueden realizar pruebas manuales mediante curl:

```bash
# Verificar herramientas disponibles
curl -X GET http://localhost:3458/tools -H "x-api-key: demo_api_key"

# Realizar una búsqueda
curl -X POST http://localhost:3458/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: demo_api_key" \
  -d '{"tool_name":"web_search","arguments":{"query":"noticias tecnología","num_results":3}}'
```

## Conclusión

La implementación de la herramienta de búsqueda web amplía significativamente las capacidades de los asistentes, permitiéndoles acceder a información actualizada de internet. Esto complementa perfectamente el servicio de clima existente y establece un patrón para la implementación de futuras herramientas MCP.

---

*Documento creado: 17 de mayo de 2025*
