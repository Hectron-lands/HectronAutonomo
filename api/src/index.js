import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Importar módulos
import { autonomyApp, autonomyWss } from './autonomy-server.js';
import metricsRouter from './routes/metrics.js';
import studioRouter from './routes/studio.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Agent-Token', 'X-User-Id', 'X-User-Name'],
}));
app.use(express.json({ limit: '64kb' }));

// Autenticación simple
function auth(req, res, next) {
  const token = process.env.AGENT_TOKEN;
  if (!token || req.get('X-Agent-Token') === token) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'hectron-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rutas de métricas
app.use('/api/metrics', metricsRouter);
app.use('/api/studio', studioRouter);

// Rutas de autonomía
app.use('/api/autonomy', autonomyApp);

// Endpoint para estado general
app.get('/api/status', auth, async (req, res) => {
  try {
    // Obtener estado de autonomía
    const autonomyStatus = await fetch(`http://localhost:${process.env.AUTONOMY_PORT || 3001}/autonomy/status`)
      .then(r => r.json())
      .catch(() => ({ ok: false }));

    res.json({
      ok: true,
      service: 'hectron-api',
      timestamp: new Date().toISOString(),
      autonomy: autonomyStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket principal para el cerebro
const brainWss = new WebSocketServer({ noServer: true, path: '/api/brain/ws' });

brainWss.on('connection', (ws) => {
  console.log('🧠 Nuevo cliente conectado al cerebro');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      // Verificar token
      if (message.token !== process.env.AGENT_TOKEN) {
        ws.close(1008, 'Token inválido');
        return;
      }

      // Manejar diferentes tipos de mensajes
      switch (message.type) {
        case 'chat-message':
          // Procesar mensaje de chat
          console.log('💬 Mensaje de chat:', message.text);
          // Aquí iría la lógica para procesar el chat
          break;
        case 'scene-change':
          // Cambiar escena
          console.log('🎭 Cambio de escena:', message.scene);
          // Enviar a PRISM Live Studio
          break;
        case 'autonomous-action':
          // Acción autónoma desde el cerebro
          console.log('🤖 Acción autónoma:', message.action);
          // Actualizar estado de autonomía
          await fetch(`http://localhost:${process.env.AUTONOMY_PORT || 3001}/autonomy/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scene: message.action.scene }),
          });
          break;
        default:
          console.log('⚠️ Tipo de mensaje desconocido:', message.type);
      }
    } catch (error) {
      console.error('❌ Error en WebSocket:', error);
      ws.send(JSON.stringify({ error: 'Error procesando mensaje' }));
    }
  });

  ws.on('close', () => {
    console.log('🔴 Cliente del cerebro desconectado');
  });
});

// Servir el overlay 3D como archivos estáticos (gratis, sin Vercel).
// El overlay queda en http://localhost:PORT/overlay/universe.html
const overlayDir = path.resolve(__dirname, '../../public/overlay');
app.use('/overlay', express.static(overlayDir));
const studioDir = path.resolve(__dirname, '../../public/studio');
const landingDir = path.resolve(__dirname, '../../public/landing');
const docsDir = path.resolve(__dirname, '../../public/docs');
app.use('/studio', express.static(studioDir));
app.use('/landing', express.static(landingDir));
app.use('/docs', express.static(docsDir));
app.get('/', (_req, res) => {
  res.redirect('/landing/index.html');
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HECTRON API Server: http://0.0.0.0:${PORT}`);
  console.log(`   WebSocket (Cerebro): ws://0.0.0.0:${PORT}/api/brain/ws`);
  console.log(`   WebSocket (Autonomía): ws://0.0.0.0:${process.env.AUTONOMY_PORT || 3001}/autonomy/ws`);
});

// Montar WebSockets en el servidor HTTP
server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  
  if (pathname === '/api/brain/ws') {
    brainWss.handleUpgrade(request, socket, head, (ws) => {
      brainWss.emit('connection', ws, request);
    });
  } else if (pathname === '/autonomy/ws') {
    autonomyWss.handleUpgrade(request, socket, head, (ws) => {
      autonomyWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Manejar errores
server.on('error', (error) => {
  console.error('❌ Error en el servidor:', error);
});

export default app;