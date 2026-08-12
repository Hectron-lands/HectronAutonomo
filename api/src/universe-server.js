import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { bigqueryClient } from '../../local-agent/src/bigquery-client.mjs';
import { callGemini, generateUniverseName, generatePlanetDescription, generateEpicEvent } from './gemini-client.js';

const app = express();
const universePort = process.env.UNIVERSE_PORT || 3002;

app.use(express.json({ limit: '10mb' }));

const universeWss = new WebSocketServer({ noServer: true, path: '/api/universe/ws' });
const connectedClients = new Set();

app.post('/universe/create', async (req, res) => {
  try {
    const { name, ownerId, ownerName, theme } = req.body;
    if (!name || !ownerId) return res.status(400).json({ ok: false, error: 'name and ownerId required' });
    const universeId = `universe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalName = name || await generateUniverseName(theme);
    await bigqueryClient.saveUniverse({ universe_id: universeId, name: finalName, owner_id: ownerId, owner_name: ownerName || ownerId, created_at: new Date().toISOString(), last_updated: new Date().toISOString(), settings: { theme: theme || 'sci-fi', difficulty: 'medium', physics: 'standard' } });
    const initialPlanets = [];
    const planetTypes = ['rocky', 'gas', 'ice', 'lava', 'ocean', 'forest'];
    for (let i = 0; i < 5; i++) {
      const planetType = planetTypes[Math.floor(Math.random() * planetTypes.length)];
      const planet = await createPlanet(universeId, ownerId, planetType);
      initialPlanets.push(planet);
    }
    broadcastToClients({ type: 'universe-created', universe: { universe_id: universeId, name: finalName, owner_id: ownerId, planets: initialPlanets } });
    res.json({ ok: true, universeId, name: finalName, ownerId, initialPlanets });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

app.get('/universe/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const universe = await bigqueryClient.getUniverse(universeId);
    if (!universe) return res.status(404).json({ ok: false, error: 'Universe not found' });
    const planets = await bigqueryClient.getPlanets(universeId);
    const players = await bigqueryClient.getPlayers(universeId);
    res.json({ ok: true, universe: { ...universe, planets_count: planets.length, players_count: players.length }, planets, players });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

app.get('/universe/list', async (req, res) => {
  try {
    const universes = await bigqueryClient.getUniverses();
    const universesWithStats = await Promise.all(universes.map(async universe => {
      const planets = await bigqueryClient.getPlanets(universe.universe_id);
      const players = await bigqueryClient.getPlayers(universe.universe_id);
      return { ...universe, planets_count: planets.length, players_count: players.length };
    }));
    res.json({ ok: true, universes: universesWithStats });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

app.get('/status', (req, res) => {
  res.json({ ok: true, service: 'universe-server', timestamp: new Date().toISOString(), connectedClients: connectedClients.size });
});

universeWss.on('connection', (ws) => {
  console.log('New client connected');
  connectedClients.add(ws);
  const sendInitialState = async () => {
    try { const universes = await bigqueryClient.getUniverses(); ws.send(JSON.stringify({ type: 'init', universes, connectedClients: connectedClients.size })); } catch (error) { console.error('Error:', error); }
  };
  sendInitialState();
  ws.on('message', async (data) => {
    try { const message = JSON.parse(data); if (message.type === 'subscribe' && message.universeId) { const universe = await bigqueryClient.getUniverse(message.universeId); const planets = await bigqueryClient.getPlanets(message.universeId); const players = await bigqueryClient.getPlayers(message.universeId); ws.send(JSON.stringify({ type: 'universe-data', universe, planets, players })); } } catch (error) { console.error('Error:', error); }
  });
  ws.on('close', () => { connectedClients.delete(ws); console.log('Client disconnected'); });
});

const universeServer = app.listen(universePort, '0.0.0.0', () => {
  console.log('Universe server running on port', universePort);
});

universeServer.on('upgrade', (request, socket, head) => {
  universeWss.handleUpgrade(request, socket, head, (ws) => { universeWss.emit('connection', ws, request); });
});

export { app as universeApp, universeWss, universeServer, universePort };
