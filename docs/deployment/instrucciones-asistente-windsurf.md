# Instrucciones para el Asistente de Código de Windsurf

Estas instrucciones te guiarán para configurar y desplegar un proyecto de asistentes virtuales con integración de herramientas externas MCP (Multi-Capability Processor).

## Tarea

Necesito que configures el proyecto "asistentes-ia-v02" para que funcione con herramientas externas MCP, y que recuperes el estilo y funcionalidad de la página de asistentes de la rama main. También debes crear una nueva tarjeta para el asistente MCP v4.

## Pasos Detallados

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Pac00n/asistentes-ia-v02.git
cd asistentes-ia-v02
git checkout feat/add-echo-tool-example
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```
NEXT_PUBLIC_OPENAI_API_KEY=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
MCP_SERVERS_CONFIG='[{"id":"local","url":"http://localhost:3001","name":"Servidor Local"}]'
```

### 4. Implementar Servidor MCP de Prueba

Crea una carpeta para el servidor MCP de prueba:

```bash
mkdir -p mcp-test-server
cd mcp-test-server
```

Crea un archivo `package.json`:

```json
{
  "name": "mcp-test-server",
  "version": "1.0.0",
  "description": "Servidor MCP de prueba",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

Crea un archivo `server.js`:

```javascript
// Servidor MCP de prueba simple
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Definición de herramientas disponibles
const tools = [
  {
    toolName: "calculator",
    description: "Calculadora que evalúa expresiones matemáticas",
    parametersSchema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Expresión matemática a evaluar"
        }
      },
      required: ["expression"]
    }
  },
  {
    toolName: "weather",
    description: "Obtiene información del clima para una ciudad",
    parametersSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Nombre de la ciudad"
        }
      },
      required: ["city"]
    }
  }
];

// Endpoint para listar herramientas disponibles
app.get('/tools', (req, res) => {
  console.log('GET /tools - Solicitud recibida');
  res.json(tools);
});

// Endpoint para ejecutar herramientas
app.post('/execute', (req, res) => {
  const { toolName, arguments: args } = req.body;
  console.log(`POST /execute - Herramienta: ${toolName}, Argumentos:`, args);

  if (!toolName) {
    return res.status(400).json({ error: "Se requiere el nombre de la herramienta" });
  }

  // Ejecutar la herramienta según su nombre
  switch (toolName) {
    case "calculator":
      if (!args.expression) {
        return res.status(400).json({ error: "Se requiere una expresión matemática" });
      }
      try {
        // Evaluación segura de expresiones matemáticas simples
        const result = eval(args.expression);
        return res.json({ result });
      } catch (error) {
        return res.status(400).json({ error: "Error al evaluar la expresión: " + error.message });
      }

    case "weather":
      if (!args.city) {
        return res.status(400).json({ error: "Se requiere el nombre de una ciudad" });
      }
      // Simulación de datos del clima
      const weatherData = {
        city: args.city,
        temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
        condition: ["soleado", "nublado", "lluvioso", "ventoso"][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 60) + 30 // 30-90%
      };
      return res.json(weatherData);

    default:
      return res.status(404).json({ error: `Herramienta '${toolName}' no encontrada` });
  }
});

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor MCP de prueba funcionando correctamente');
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor MCP de prueba ejecutándose en http://0.0.0.0:${port}`);
});
```

Instala las dependencias e inicia el servidor:

```bash
npm install
node server.js &
```

### 5. Recuperar Estilo y Funcionalidad de la Rama Main

Primero, guarda los cambios actuales:

```bash
cd ..
git add .
git commit -m "Guardar cambios actuales antes de fusionar"
```

Ahora, recupera el estilo y funcionalidad de la rama main:

```bash
git checkout main -- app/assistants/page.tsx
git checkout main -- app/assistants/loading.tsx
git checkout main -- app/chat-v3/[assistantId]/page.tsx
```

### 6. Modificar la Página de Asistentes

Edita el archivo `app/assistants/page.tsx` para añadir la tarjeta MCP v4:

```typescript
// Busca la sección donde se definen las tarjetas de asistentes
// Después de la tarjeta del asistente señalizado, añade:

<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>MCP v4</CardTitle>
    <CardDescription>
      Asistente con herramientas externas MCP
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Este asistente utiliza herramientas de servidores externos MCP para proporcionar funcionalidades avanzadas.
    </p>
  </CardContent>
  <CardFooter>
    <Link
      href="/chat/mcpv4/mcp-v4-tools"
      className={cn(
        buttonVariants(),
        "w-full"
      )}
    >
      Iniciar chat
    </Link>
  </CardFooter>
</Card>
```

### 7. Asegurar que el Cliente MCP Utilice Llamadas HTTP Reales

Edita el archivo `lib/mcp/client.ts` para asegurarte de que las llamadas HTTP reales estén habilitadas:

1. Busca la función `discoverToolsFromServer`
2. Asegúrate de que el código para realizar llamadas HTTP reales esté descomentado
3. Busca la función `executeTool`
4. Asegúrate de que el código para realizar llamadas HTTP reales esté descomentado

### 8. Compilar el Código TypeScript

```bash
# Crea un archivo tsconfig.test.json para compilar el código
cat > tsconfig.test.json << 'EOL'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": false,
    "outDir": "./dist",
    "esModuleInterop": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["lib/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL

# Compila el código TypeScript
npx tsc -p tsconfig.test.json
```

### 9. Iniciar la Aplicación

```bash
npm run dev
```

### 10. Probar la Funcionalidad

1. Abre un navegador y ve a http://localhost:3000
2. Navega a la página de asistentes
3. Verifica que aparezcan las dos tarjetas: "Asistente Señalizado" y "MCP v4"
4. Prueba el asistente señalizado haciendo clic en su tarjeta
5. Prueba el asistente MCP v4 haciendo clic en su tarjeta
6. Para el asistente MCP v4, prueba las herramientas externas con:
   - "¿Puedes calcular 25 * 16?"
   - "¿Cuál es el clima en Madrid?"

### 11. Verificación Final

Asegúrate de que:
1. Ambos asistentes funcionen correctamente
2. El estilo visual sea consistente con la rama main
3. Las herramientas externas MCP respondan correctamente a las consultas

### 12. Commit y Push de los Cambios

```bash
git add .
git commit -m "Integrar tarjeta MCP v4 y recuperar estilo de la rama main"
git push origin feat/add-echo-tool-example
```

## Notas Importantes

- Asegúrate de que el servidor MCP esté ejecutándose en segundo plano mientras pruebas la aplicación
- Si encuentras errores en la integración de estilos, prioriza la funcionalidad sobre la apariencia
- Verifica que las rutas y nombres de archivos sean correctos según la estructura del proyecto
- Si hay conflictos al fusionar archivos de la rama main, resuelve manualmente preservando tanto la funcionalidad como el estilo

## Solución de Problemas

Si encuentras problemas durante la configuración:

1. **Error al iniciar el servidor MCP**: Verifica que el puerto 3001 esté disponible
2. **Error al compilar TypeScript**: Asegúrate de que tsconfig.test.json tenga la configuración correcta
3. **Las herramientas externas no funcionan**: Verifica que el servidor MCP esté ejecutándose y que la configuración en .env.local sea correcta
4. **Problemas de estilo**: Compara con los archivos originales de la rama main para identificar diferencias
