import express from 'express';
import { bigqueryClient } from '../../../local-agent/src/bigquery-client.mjs';
import { generateUniverseName, generatePlanetDescription, generateEpicEvent } from '../gemini-client.js';

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, ownerId, ownerName, theme } = req.body;
    if (!ownerId) return res.status(400).json({ ok: false, error: 'ownerId required' });
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
    res.json({ ok: true, message: 'Universe created', universeId, name: finalName, ownerId, initialPlanets });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.get('/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const universe = await bigqueryClient.getUniverse(universeId);
    if (!universe) return res.status(404).json({ ok: false, error: 'Universe not found' });
    const planets = await bigqueryClient.getPlanets(universeId);
    const players = await bigqueryClient.getPlayers(universeId);
    const events = await bigqueryClient.getEvents(universeId, 7);
    res.json({ ok: true, universe: { ...universe, planets_count: planets.length, players_count: players.length, events_count: events.length }, planets, players, events });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.get('/list', async (req, res) => {
  try {
    const universes = await bigqueryClient.getUniverses();
    const universesWithStats = await Promise.all(universes.map(async universe => {
      const planets = await bigqueryClient.getPlanets(universe.universe_id);
      const players = await bigqueryClient.getPlayers(universe.universe_id);
      const events = await bigqueryClient.getEvents(universe.universe_id, 7);
      return { universe_id: universe.universe_id, name: universe.name, owner_id: universe.owner_id, owner_name: universe.owner_name, created_at: universe.created_at, planets_count: planets.length, players_count: players.length, events_count: events.length, settings: universe.settings };
    }));
    res.json({ ok: true, universes: universesWithStats });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.get('/:universeId/planets', async (req, res) => {
  try {
    const { universeId } = req.params;
    const planets = await bigqueryClient.getPlanets(universeId);
    res.json({ ok: true, universeId, planets });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.post('/:universeId/planets', async (req, res) => {
  try {
    const { universeId } = req.params;
    const { discovererId, discovererName, planetType } = req.body;
    const universe = await bigqueryClient.getUniverse(universeId);
    if (!universe) return res.status(404).json({ ok: false, error: 'Universe not found' });
    const planet = await createPlanet(universeId, discovererId, planetType);
    res.json({ ok: true, message: 'Planet created', planet });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.get('/:universeId/players', async (req, res) => {
  try {
    const { universeId } = req.params;
    const players = await bigqueryClient.getPlayers(universeId);
    res.json({ ok: true, universeId, players });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.post('/:universeId/players', async (req, res) => {
  try {
    const { universeId } = req.params;
    const { playerId, playerName, avatarUrl } = req.body;
    if (!playerId) return res.status(400).json({ ok: false, error: 'playerId required' });
    const universe = await bigqueryClient.getUniverse(universeId);
    if (!universe) return res.status(404).json({ ok: false, error: 'Universe not found' });
    let player = await bigqueryClient.getPlayer(universeId, playerId);
    if (!player) player = await createPlayer(universeId, playerId, playerName, avatarUrl);
    else player = await updatePlayer(universeId, playerId, { name: playerName, avatar_url: avatarUrl });
    res.json({ ok: true, player });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.post('/:universeId/command', async (req, res) => {
  try {
    const { universeId } = req.params;
    const { playerId, playerName, command } = req.body;
    if (!playerId || !command) return res.status(400).json({ ok: false, error: 'playerId and command required' });
    const universe = await bigqueryClient.getUniverse(universeId);
    if (!universe) return res.status(404).json({ ok: false, error: 'Universe not found' });
    const result = await processCommand(universeId, playerId, playerName, command);
    await bigqueryClient.saveChatLog({ userId: playerId, userName: playerName, message: command, scene: 'UNIVERSE_SCENE', processingTimeMs: result.executionTime || 0 });
    res.json({ ok: true, ...result });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

router.post('/:universeId/events', async (req, res) => {
  try {
    const { universeId } = req.params;
    const { eventType } = req.body;
    const universe = await bigqueryClient.getUniverse(universeId);
    if (!universe) return res.status(404).json({ ok: false, error: 'Universe not found' });
    const event = await generateEpicEvent(universeId, eventType);
    await bigqueryClient.saveEvent({ universe_id: universeId, type: event.type, title: event.title, description: event.description, participants: event.participants, consequences: event.consequences, duration: event.duration, timestamp: new Date().toISOString() });
    await applyEventConsequences(universeId, event);
    res.json({ ok: true, event });
  } catch (error) { console.error('Error:', error); res.status(500).json({ ok: false, error: error.message }); }
});

async function createPlanet(universeId, discovererId, planetType = null) {
  const types = ['rocky', 'gas', 'ice', 'lava', 'ocean', 'forest', 'desert', 'volcanic'];
  const type = planetType || types[Math.floor(Math.random() * types.length)];
  const namePrompt = `Generate unique name for a ${type} planet`;
  const planetName = await callGemini(namePrompt, { temperature: 0.9 });
  const description = await generatePlanetDescription({ name: planetName.replace(/["'\n\r]/g, '').trim(), type });
  const position = { x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, z: (Math.random() - 0.5) * 1000 };
  const resources = generatePlanetResources(type);
  const size = type === 'gas' ? 20 + Math.random() * 30 : 5 + Math.random() * 15;
  const planetId = `planet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await bigqueryClient.savePlanet({ planet_id: planetId, universe_id: universeId, name: planetName.replace(/["'\n\r]/g, '').trim(), type, position, description, size, resources, discovered_by: discovererId, discovered_at: new Date().toISOString(), inhabitants: [], buildings: [], owner: null });
  return { planet_id: planetId, universe_id: universeId, name: planetName.replace(/["'\n\r]/g, '').trim(), type, position, description, size, resources, discovered_by: discovererId, discovered_at: new Date().toISOString() };
}

function generatePlanetResources(type) {
  const base = { iron: Math.floor(Math.random() * 500) + 100, gold: Math.floor(Math.random() * 200) + 50, crystal: Math.floor(Math.random() * 100) + 20, energy: Math.floor(Math.random() * 300) + 100, knowledge: Math.floor(Math.random() * 150) + 50 };
  switch (type) { case 'lava': base.iron *= 2; base.gold *= 1.5; break; case 'gas': base.energy *= 3; base.crystal *= 0.5; break; case 'ice': base.crystal *= 3; base.energy *= 1.5; break; case 'ocean': base.knowledge *= 2; base.iron *= 0.5; break; case 'forest': base.knowledge *= 1.5; base.gold *= 1.5; break; }
  return base;
}

async function createPlayer(universeId, playerId, playerName, avatarUrl) {
  const initialResources = JSON.parse(process.env.INITIAL_RESOURCES || '{"iron":100,"gold":50,"crystal":20,"energy":200,"knowledge":100}');
  await bigqueryClient.savePlayer({ player_id: playerId, universe_id: universeId, name: playerName || playerId, avatar_url: avatarUrl || null, inventory: initialResources, level: 1, faction: null, achievements: [], discovered_planets: [], last_active: new Date().toISOString(), created_at: new Date().toISOString() });
  return { player_id: playerId, universe_id: universeId, name: playerName || playerId, avatar_url: avatarUrl || null, inventory: initialResources, level: 1, faction: null, achievements: [], discovered_planets: [], last_active: new Date().toISOString() };
}

async function updatePlayer(universeId, playerId, updates) {
  const player = await bigqueryClient.getPlayer(universeId, playerId);
  if (!player) throw new Error('Player not found');
  const updatedPlayer = { ...player, ...updates, last_active: new Date().toISOString() };
  await bigqueryClient.updatePlayer(universeId, playerId, updates);
  return updatedPlayer;
}

async function processCommand(universeId, playerId, playerName, command) {
  const startTime = Date.now();
  const [cmd, ...args] = command.split(' ');
  const normalizedCmd = cmd.toLowerCase().replace('/', '');
  try {
    switch (normalizedCmd) {
      case 'explorar': case 'explore': return await handleExploreCommand(universeId, playerId, playerName, args);
      case 'construir': case 'build': return await handleBuildCommand(universeId, playerId, args);
      case 'minar': case 'mine': return await handleMineCommand(universeId, playerId, args);
      case 'atacar': case 'attack': return await handleAttackCommand(universeId, playerId, args);
      case 'comerciar': case 'trade': return await handleTradeCommand(universeId, playerId, args);
      case 'votar': case 'vote': return await handleVoteCommand(universeId, playerId, args);
      case 'ayuda': case 'help': return handleHelpCommand();
      case 'inventario': case 'inventory': return await handleInventoryCommand(universeId, playerId);
      case 'estados': case 'stats': return await handleStatsCommand(universeId, playerId);
      default: return { response: 'Comando desconocido: /' + cmd, executionTime: Date.now() - startTime };
    }
  } catch (error) { return { response: 'Error: ' + error.message, executionTime: Date.now() - startTime, error: true }; }
}

function handleHelpCommand() {
  return { response: 'COMANDOS: /explorar, /construir, /minar, /atacar, /comerciar, /votar, /inventario, /estados, /ayuda', executionTime: 0 };
}

async function handleInventoryCommand(universeId, playerId) {
  const startTime = Date.now();
  const player = await bigqueryClient.getPlayer(universeId, playerId);
  if (!player) return { response: 'Player not found', executionTime: Date.now() - startTime };
  const inventory = player.inventory || {};
  const inventoryText = Object.entries(inventory).map(([r, a]) => r + ': ' + a).join(', ');
  return { response: 'INVENTARIO: ' + inventoryText, executionTime: Date.now() - startTime, inventory };
}

async function handleStatsCommand(universeId, playerId) {
  const startTime = Date.now();
  const player = await bigqueryClient.getPlayer(universeId, playerId);
  if (!player) return { response: 'Player not found', executionTime: Date.now() - startTime };
  const discoveredPlanets = player.discovered_planets?.length || 0;
  const achievements = player.achievements?.length || 0;
  const totalResources = Object.values(player.inventory || {}).reduce((sum, amount) => sum + amount, 0);
  return { response: 'ESTADISTICAS: Nivel ' + player.level + ', Planetas: ' + discoveredPlanets + ', Logros: ' + achievements + ', Recursos: ' + totalResources, executionTime: Date.now() - startTime };
}

async function applyEventConsequences(universeId, event) {}

import { callGemini } from '../gemini-client.js';

export default router;
