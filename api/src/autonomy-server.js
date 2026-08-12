import express from 'express';
import { WebSocketServer } from 'ws';
import { callGemini } from './gemini-client.js';
import { bigqueryClient } from '../../local-agent/src/bigquery-client.mjs';

/**
 * Servidor de Autonomía para HECTRON
 * Se activa cuando no hay interacción humana después de un umbral de tiempo
 */
const app = express();
const autonomyPort = process.env.AUTONOMY_PORT || 3001;

app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Agent-Token');
  next();
});

// Servidor WebSocket para autonomía
const autonomyWss = new WebSocketServer({ noServer: true, path: '/autonomy/ws' });

// Almacenar última actividad
let lastActivityTime = Date.now();
let currentScene = 'DEFAULT';
let isStreaming = false;

// Actualizar última actividad
app.post('/autonomy/activity', (req, res) => {
  lastActivityTime = Date.now();
  if (req.body.scene) currentScene = req.body.scene;
  if (req.body.streaming !== undefined) isStreaming = req.body.streaming;
  res.json({ ok: true, lastActivity: lastActivityTime });
});

// Obtener estado de autonomía
app.get('/autonomy/status', async (req, res) => {
  try {
    const metrics = await bigqueryClient.getAllMetrics(7);
    res.json({
      ok: true,
      autonomous: true,
      lastActivity: lastActivityTime,
      currentScene,
      isStreaming,
      timeSinceLastActivity: Date.now() - lastActivityTime,
      threshold: parseInt(process.env.AUTONOMOUS_THRESHOLD_MS || '120000'),
      metrics,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar acción autónoma (endpoint para pruebas)
app.post('/autonomy/generate', async (req, res) => {
  try {
    const action = await generateAutonomousAction(currentScene);
    res.json({ ok: true, action });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket: Conexión de clientes
autonomyWss.on('connection', (ws) => {
  console.log('🤖 Nuevo cliente de autonomía conectado');

  // Enviar estado inicial
  ws.send(JSON.stringify({
    type: 'autonomy-status',
    lastActivity: lastActivityTime,
    currentScene,
    isStreaming,
    threshold: parseInt(process.env.AUTONOMOUS_THRESHOLD_MS || '120000'),
  }));

  // Bucle de verificación de autonomía
  const autonomyInterval = setInterval(async () => {
    try {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      const threshold = parseInt(process.env.AUTONOMOUS_THRESHOLD_MS || '120000');

      if (timeSinceLastActivity > threshold && isStreaming) {
        const start = Date.now();
        const autonomousAction = await generateAutonomousAction(currentScene);
        const executionTime = Date.now() - start;

        // Guardar en BigQuery
        await bigqueryClient.saveAutonomousDecision({
          type: autonomousAction.type,
          value: autonomousAction,
          context: `Escena: ${currentScene}, Inactividad: ${timeSinceLastActivity}ms, Streaming: ${isStreaming}`,
          executionTimeMs: executionTime,
          success: true,
        });

        // Enviar acción al cliente
        ws.send(JSON.stringify({
          type: 'autonomous-action',
          action: autonomousAction,
          timestamp: new Date().toISOString(),
          executionTimeMs: executionTime,
        }));

        console.log('🤖 Acción autónoma generada:', autonomousAction);
      }
    } catch (error) {
      console.error('❌ Error en bucle de autonomía:', error);
    }
  }, 5000); // Verificar cada 5 segundos

  // Manejar mensajes del cliente
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'update-scene':
          currentScene = message.scene;
          break;
        case 'update-streaming':
          isStreaming = message.streaming;
          break;
        case 'update-activity':
          lastActivityTime = Date.now();
          break;
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
    }
  });

  // Limpiar al cerrar
  ws.on('close', () => {
    clearInterval(autonomyInterval);
    console.log('🤖 Cliente de autonomía desconectado');
  });
});

// Generar acción autónoma con Gemini
async function generateAutonomousAction(currentScene) {
  const autonomousScenes = process.env.AUTONOMOUS_SCENES?.split(',') || 
    ['HAPPY_SCENE', 'SAD_SCENE', 'ANGRY_SCENE', 'SURPRISE_SCENE', 'FLIRT_SCENE', 'DEFAULT'];

  const prompt = `Eres HECTRON, un sistema autónomo de streaming con Miku 3D para TikTok LIVE.
  
  CONTEXTO ACTUAL:
  - Escena actual de OBS: ${currentScene}
  - Escenas disponibles para autonomía: ${autonomousScenes.join(', ')}
  - El stream está ACTIVO
  - No ha habido interacción humana en los últimos minutos
  
  GENERA UNA ACCIÓN AUTÓNOMA INTERESANTE Y CREATIVA.
  
  OPCIONES DE ACCIÓN (elige UNA):
  1. Cambiar de escena: {"type": "scene-change", "value": "NOMBRE_ESCENA"}
  2. Hablar algo: {"type": "speak", "value": "texto para decir con TTS en español"}
  3. Mostrar emoción: {"type": "emotion", "value": "HAPPY|SAD|ANGRY|SURPRISE|FLIRT|NEUTRAL"}
  4. Iniciar/Detener stream: {"type": "stream", "value": "start|stop"}
  
  REGLAS:
  - El texto para "speak" debe ser CREATIVO, INTERESANTE y en ESPAÑOL
  - Si eliges "scene-change", usa SOLO escenas de la lista disponible
  - Si eliges "emotion", usa SOLO valores de la lista
  - Sé VARIADO: no repitas la misma acción seguida
  - Considera el contexto: si la escena es HAPPY, no cambies a SAD
  
  Responde SOLO con JSON válido: {"type": "...", "value": "..."}`;

  try {
    const response = await callGemini(prompt);
    
    // Parsear la respuesta
    try {
      const action = JSON.parse(response);
      
      // Validar la acción
      if (autonomousScenes.includes(action.value) && action.type === 'scene-change') {
        return action;
      }
      if (['speak', 'emotion', 'stream'].includes(action.type)) {
        return action;
      }
    } catch {
      // Fallback: generar acción aleatoria
    }

    // Fallback: acción por defecto
    const randomIndex = Math.floor(Math.random() * autonomousScenes.length);
    return {
      type: 'scene-change',
      value: autonomousScenes[randomIndex],
    };
  } catch (error) {
    console.error('❌ Error generando acción autónoma:', error);
    // Fallback seguro
    return {
      type: 'emotion',
      value: 'NEUTRAL',
    };
  }
}

// Iniciar servidor
const autonomyServer = app.listen(autonomyPort, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Autonomía: http://0.0.0.0:${autonomyPort}`);
  console.log(`   WebSocket: ws://0.0.0.0:${autonomyPort}/autonomy/ws`);
});

// Montar WebSocket en el servidor HTTP
autonomyServer.on('upgrade', (request, socket, head) => {
  autonomyWss.handleUpgrade(request, socket, head, (ws) => {
    autonomyWss.emit('connection', ws, request);
  });
});

export { app as autonomyApp, autonomyWss, generateAutonomousAction, lastActivityTime, currentScene, isStreaming };