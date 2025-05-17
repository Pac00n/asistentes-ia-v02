// wrapper.js
// Script intermediario para facilitar la comunicación entre la aplicación y el servidor MCP
const { spawn } = require('child_process');
const path = require('path');
const process = require('process');

console.error("Wrapper: Iniciando script intermediario para el servidor MCP...");

// Construir la ruta al script del servidor MCP
const serverScriptPath = path.join(__dirname, 'index.js');
console.error(`Wrapper: Ruta al script del servidor: ${serverScriptPath}`);

// Iniciar el servidor MCP
console.error("Wrapper: Iniciando proceso del servidor MCP...");
const serverProcess = spawn('node', [serverScriptPath]);

console.error(`Wrapper: Proceso iniciado con PID: ${serverProcess.pid}`);

// Redirigir stdin/stdout entre este proceso y el servidor MCP
process.stdin.pipe(serverProcess.stdin);
serverProcess.stdout.pipe(process.stdout);

// Manejar errores del servidor para depuración
serverProcess.stderr.on('data', (data) => {
  console.error(`Wrapper [Debug]: ${data.toString()}`);
});

// Manejar la terminación
process.on('SIGTERM', () => {
  console.error("Wrapper: Recibida señal SIGTERM, terminando el servidor MCP...");
  serverProcess.kill();
  process.exit(0);
});

// Manejar errores del proceso del servidor
serverProcess.on('error', (err) => {
  console.error(`Wrapper: Error en el proceso del servidor MCP: ${err.message}`);
});

// Manejar la finalización del proceso del servidor
serverProcess.on('close', (code) => {
  console.error(`Wrapper: El proceso del servidor MCP se cerró con código: ${code}`);
  process.exit(code);
});

console.error("Wrapper: Configuración completada, esperando solicitudes...");
