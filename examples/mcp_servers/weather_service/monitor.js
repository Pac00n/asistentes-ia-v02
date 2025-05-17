// monitor.js - Sistema de monitorización para el servidor MCP SSE
const fs = require('fs');
const path = require('path');

class MCPMonitor {
  constructor(options = {}) {
    this.logDir = options.logDir || './logs';
    this.logFile = options.logFile || 'mcp_server.log';
    this.metricsFile = options.metricsFile || 'mcp_metrics.json';
    this.metrics = {
      startTime: new Date().toISOString(),
      requests: {
        total: 0,
        byEndpoint: {},
        byTool: {}
      },
      errors: {
        total: 0,
        byType: {}
      },
      performance: {
        averageResponseTime: 0,
        totalResponseTime: 0
      },
      lastReset: new Date().toISOString()
    };
    
    // Crear directorio de logs si no existe
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Cargar métricas existentes si hay
    this.loadMetrics();
    
    // Log inicial
    this.log('info', 'Monitor iniciado');
  }
  
  // Registrar un evento en el log
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    const logPath = path.join(this.logDir, this.logFile);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logPath, logLine);
    
    // Mostrar en consola los mensajes importantes
    if (level === 'error' || level === 'warn') {
      console.error(`[${level.toUpperCase()}] ${timestamp}: ${message}`, data || '');
    } else if (process.env.DEBUG) {
      console.log(`[${level}] ${timestamp}: ${message}`, data || '');
    }
    
    return logEntry;
  }
  
  // Registrar el inicio de una solicitud
  startRequest(req) {
    const endpoint = req.path;
    const method = req.method;
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Incrementar contadores
    this.metrics.requests.total++;
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // Guardar tiempo de inicio
    req._mcp_monitor = {
      id,
      startTime: Date.now(),
      endpoint,
      method
    };
    
    this.log('info', `Solicitud iniciada: ${method} ${endpoint}`, { id, ip: req.ip });
    return id;
  }
  
  // Registrar el fin de una solicitud
  endRequest(req, res) {
    if (!req._mcp_monitor) return null;
    
    const endTime = Date.now();
    const duration = endTime - req._mcp_monitor.startTime;
    const statusCode = res.statusCode;
    
    // Actualizar métricas de tiempo de respuesta
    this.metrics.performance.totalResponseTime += duration;
    this.metrics.performance.averageResponseTime = 
      this.metrics.performance.totalResponseTime / this.metrics.requests.total;
    
    const data = {
      id: req._mcp_monitor.id,
      duration,
      statusCode,
      endpoint: req._mcp_monitor.endpoint,
      method: req._mcp_monitor.method
    };
    
    // Registrar errores si ocurren
    if (statusCode >= 400) {
      const errorType = Math.floor(statusCode / 100) * 100;
      this.metrics.errors.total++;
      this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
      this.log('warn', `Solicitud fallida: ${statusCode} ${req._mcp_monitor.method} ${req._mcp_monitor.endpoint}`, data);
    } else {
      this.log('info', `Solicitud completada: ${req._mcp_monitor.method} ${req._mcp_monitor.endpoint}`, data);
    }
    
    // Guardar métricas periódicamente
    if (this.metrics.requests.total % 10 === 0) {
      this.saveMetrics();
    }
    
    return data;
  }
  
  // Registrar la ejecución de una herramienta
  logToolExecution(toolName, params, result) {
    // Actualizar métricas de herramientas
    this.metrics.requests.byTool[toolName] = (this.metrics.requests.byTool[toolName] || 0) + 1;
    
    const data = {
      toolName,
      params,
      result: typeof result === 'object' ? 'object' : result
    };
    
    this.log('info', `Herramienta ejecutada: ${toolName}`, data);
  }
  
  // Cargar métricas desde el archivo
  loadMetrics() {
    try {
      const metricsPath = path.join(this.logDir, this.metricsFile);
      if (fs.existsSync(metricsPath)) {
        const data = fs.readFileSync(metricsPath, 'utf8');
        const savedMetrics = JSON.parse(data);
        this.metrics = savedMetrics;
        this.log('info', 'Métricas cargadas desde archivo');
      }
    } catch (error) {
      this.log('error', 'Error al cargar métricas', error.message);
    }
  }
  
  // Guardar métricas en el archivo
  saveMetrics() {
    try {
      const metricsPath = path.join(this.logDir, this.metricsFile);
      fs.writeFileSync(metricsPath, JSON.stringify(this.metrics, null, 2));
      this.log('info', 'Métricas guardadas en archivo');
    } catch (error) {
      this.log('error', 'Error al guardar métricas', error.message);
    }
  }
  
  // Obtener resumen de métricas
  getMetricsSummary() {
    return {
      uptime: new Date() - new Date(this.metrics.startTime),
      requests: this.metrics.requests.total,
      errors: this.metrics.errors.total,
      averageResponseTime: Math.round(this.metrics.performance.averageResponseTime),
      topEndpoints: Object.entries(this.metrics.requests.byEndpoint)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([endpoint, count]) => ({ endpoint, count })),
      topTools: Object.entries(this.metrics.requests.byTool)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tool, count]) => ({ tool, count }))
    };
  }
  
  // Middleware Express para monitorización automática
  middleware() {
    return (req, res, next) => {
      this.startRequest(req);
      
      // Capturar el final de la solicitud
      res.on('finish', () => {
        this.endRequest(req, res);
      });
      
      next();
    };
  }
}

module.exports = MCPMonitor;
