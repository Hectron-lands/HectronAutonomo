/**
 * HECTRON Live Universe - Overlay 3D Script v2.0
 *
 * Animaciones 3D: estrellas, nebulosas, cometas, planetas con órbitas,
 * portales de emoción, partículas reactivas, anillos de energía, soles pulsantes.
 */
const CONFIG = {
    WS_URL: window.location.hostname === 'localhost' ? 'ws://localhost:3000/api/brain/ws' : 'wss://' + window.location.host + '/api/brain/ws',
    API_BASE: window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://' + window.location.host,
    CAMERA: { fov: 75, near: 0.1, far: 10000, position: { x: 0, y: 30, z: 120 } },
    COLORS: {
        background: 0x000000, grid: 0x0a0a1e, star: 0xffffff,
        nebula: { purple: 0x6a0dad, blue: 0x1e90ff, pink: 0xff69b4, green: 0x00ff88 },
        planet: { rocky: 0x888888, gas: 0x4a90e2, ice: 0xa8d8ea, lava: 0xff4500, ocean: 0x1e90ff, forest: 0x228b22, desert: 0xffd700, volcanic: 0xff6600 },
        orbit: 0x333366, label: 0x00ff88,
        emotion: { Joy: 0xffd700, Angry: 0xff3333, Sorrow: 0x3366ff, Fun: 0xff66cc, Neutral: 0x88aaaa }
    },
    ANIMATION: { rotationSpeed: 0.002, orbitSpeed: 0.008, cometSpeed: 0.5, nebulaPulse: 0.01 }
};

const state = {
    universes: [], currentUniverse: null, planets: [], players: [],
    user: { playerId: null, playerName: 'Espectador', inventory: {}, level: 1, faction: null },
    ws: null, reconnectAttempts: 0, maxReconnectAttempts: 10, reconnectDelay: 3000,
    camera: null, scene: null, renderer: null, controls: null,
    planetObjects: new Map(), starField: null, gridHelper: null, isInitialized: false,
    comets: [], nebulas: [], emotionPortal: null, particleSystem: null,
    sun: null, energyRings: [], currentEmotion: 'Neutral', emotionTimer: 0
};

// ═══════════════════════════════════════════════════════════════════════════
// ESCENA 3D
// ═══════════════════════════════════════════════════════════════════════════

function initThreeJS() {
    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.FogExp2(0x000011, 0.0008);

    state.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.fov, window.innerWidth / window.innerHeight, CONFIG.CAMERA.near, CONFIG.CAMERA.far);
    state.camera.position.set(CONFIG.CAMERA.position.x, CONFIG.CAMERA.position.y, CONFIG.CAMERA.position.z);

    state.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(window.devicePixelRatio || 1);
    document.getElementById('universe-container').appendChild(state.renderer.domElement);

    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.05;
    state.controls.minDistance = 30;
    state.controls.maxDistance = 500;
    state.controls.autoRotate = true;
    state.controls.autoRotateSpeed = 0.3;

    // Luces
    state.scene.add(new THREE.AmbientLight(0x404060, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 1);
    state.scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x00ff88, 1, 300);
    pointLight.position.set(0, 0, 0);
    state.scene.add(pointLight);

    createStarField();
    createNebulas();
    createSun();
    createEnergyRings();
    createComets();
    createParticleSystem();

    state.gridHelper = new THREE.GridHelper(2000, 100, CONFIG.COLORS.grid, CONFIG.COLORS.grid);
    state.gridHelper.position.y = -50;
    state.scene.add(state.gridHelper);

    window.addEventListener('resize', onWindowResize);
    animate();
}

// ─── Campo de estrellas (5000 estrellas con parpadeo) ────────────────────────
function createStarField() {
    const geo = new THREE.BufferGeometry();
    const verts = [];
    const colors = [];
    for (let i = 0; i < 5000; i++) {
        verts.push((Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000);
        const c = Math.random();
        if (c > 0.95) colors.push(0.6, 0.8, 1.0);      // azul
        else if (c > 0.9) colors.push(1.0, 0.8, 0.6);  // naranja
        else colors.push(1, 1, 1);                      // blanco
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true });
    state.starField = new THREE.Points(geo, mat);
    state.scene.add(state.starField);
}

// ─── Nebulosas (nubes de gas pulsantes) ──────────────────────────────────────
function createNebulas() {
    const nebulaColors = [CONFIG.COLORS.nebula.purple, CONFIG.COLORS.nebula.blue, CONFIG.COLORS.nebula.pink, CONFIG.COLORS.nebula.green];
    nebulaColors.forEach((color, i) => {
        const geo = new THREE.BufferGeometry();
        const verts = [];
        const cx = (Math.random() - 0.5) * 800;
        const cy = (Math.random() - 0.5) * 400;
        const cz = (Math.random() - 0.5) * 800;
        for (let j = 0; j < 800; j++) {
            verts.push(
                cx + (Math.random() - 0.5) * 200,
                cy + (Math.random() - 0.5) * 100,
                cz + (Math.random() - 0.5) * 200
            );
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        const mat = new THREE.PointsMaterial({ color, size: 3, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, sizeAttenuation: true });
        const nebula = new THREE.Points(geo, mat);
        nebula.userData = { baseOpacity: 0.15, phase: i * 1.5 };
        state.nebulas.push(nebula);
        state.scene.add(nebula);
    });
}

// ─── Sol central pulsante ────────────────────────────────────────────────────
function createSun() {
    const geo = new THREE.SphereGeometry(8, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 });
    state.sun = new THREE.Mesh(geo, mat);
    state.sun.position.set(0, 0, 0);
    state.scene.add(state.sun);

    // Halo del sol
    const haloGeo = new THREE.SphereGeometry(12, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.3, side: THREE.BackSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    state.sun.add(halo);
    state.sun.userData = { halo };
}

// ─── Anillos de energía orbitando el sol ────────────────────────────────────
function createEnergyRings() {
    for (let i = 0; i < 3; i++) {
        const radius = 20 + i * 15;
        const geo = new THREE.TorusGeometry(radius, 0.3, 8, 100);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = Math.PI / 2 + (i * 0.3);
        ring.rotation.z = i * 0.5;
        ring.userData = { speed: 0.003 + i * 0.001, axis: i };
        state.energyRings.push(ring);
        state.scene.add(ring);
    }
}

// ─── Cometas cruzando el espacio ─────────────────────────────────────────────
function createComets() {
    for (let i = 0; i < 5; i++) spawnComet();
}

function spawnComet() {
    const geo = new THREE.BufferGeometry();
    const verts = [0, 0, 0];
    // Cola del cometa
    for (let i = 1; i < 20; i++) {
        verts.push((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, -i * 3);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00ffff, size: 2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const comet = new THREE.Points(geo, mat);
    comet.position.set((Math.random() - 0.5) * 600, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 600);
    comet.userData = {
        velocity: new THREE.Vector3((Math.random() - 0.5) * CONFIG.ANIMATION.cometSpeed, (Math.random() - 0.5) * CONFIG.ANIMATION.cometSpeed * 0.5, (Math.random() - 0.5) * CONFIG.ANIMATION.cometSpeed),
        life: 600
    };
    state.comets.push(comet);
    state.scene.add(comet);
}

// ─── Sistema de partículas reactivas (responde a emociones) ─────────────────
function createParticleSystem() {
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        velocities[i * 3] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    const mat = new THREE.PointsMaterial({ color: CONFIG.COLORS.emotion.Neutral, size: 1.5, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    state.particleSystem = new THREE.Points(geo, mat);
    state.particleSystem.userData = { velocities };
    state.scene.add(state.particleSystem);
}

// ─── Portal de emoción (anillo de luz que aparece al sentir algo) ────────────
function triggerEmotionPortal(emotion) {
    const color = CONFIG.COLORS.emotion[emotion] || CONFIG.COLORS.emotion.Neutral;
    if (state.emotionPortal) {
        state.scene.remove(state.emotionPortal);
    }
    const geo = new THREE.TorusGeometry(30, 2, 16, 100);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    state.emotionPortal = new THREE.Mesh(geo, mat);
    state.emotionPortal.position.set(0, 0, 0);
    state.emotionPortal.userData = { life: 120, maxLife: 120, color };
    state.scene.add(state.emotionPortal);

    // Cambiar color de partículas
    if (state.particleSystem) {
        state.particleSystem.material.color.setHex(color);
    }
    state.currentEmotion = emotion;
    state.emotionTimer = 180; // 3 segundos a 60fps

    showNotification(`🎭 Emoción: ${emotion}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOOP DE ANIMACIÓN
// ═══════════════════════════════════════════════════════════════════════════

function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    // Estrellas rotan lento
    if (state.starField) state.starField.rotation.y += CONFIG.ANIMATION.rotationSpeed;

    // Nebulosas pulsan
    state.nebulas.forEach(n => {
        n.rotation.y += 0.0005;
        n.material.opacity = n.userData.baseOpacity + Math.sin(t + n.userData.phase) * 0.05;
    });

    // Sol pulsa
    if (state.sun) {
        const pulse = 1 + Math.sin(t * 2) * 0.1;
        state.sun.scale.setScalar(pulse);
        state.sun.userData.halo.scale.setScalar(1 + Math.sin(t * 1.5) * 0.15);
    }

    // Anillos de energía rotan
    state.energyRings.forEach(ring => {
        if (ring.userData.axis === 0) ring.rotation.z += ring.userData.speed;
        else if (ring.userData.axis === 1) ring.rotation.x += ring.userData.speed;
        else ring.rotation.y += ring.userData.speed;
    });

    // Cometas se mueven y se regeneran
    state.comets = state.comets.filter(comet => {
        comet.position.add(comet.userData.velocity);
        comet.userData.life--;
        comet.material.opacity = Math.max(0, comet.userData.life / 600);
        if (comet.userData.life <= 0) {
            state.scene.remove(comet);
            return false;
        }
        return true;
    });
    if (state.comets.length < 5 && Math.random() < 0.02) spawnComet();

    // Partículas reactivas: se mueven y responden a emociones
    if (state.particleSystem) {
        const positions = state.particleSystem.geometry.attributes.position.array;
        const velocities = state.particleSystem.userData.velocities.array;
        const speed = state.emotionTimer > 0 ? 2 : 1; // más rápido con emoción
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * speed * 0.1;
            positions[i + 1] += velocities[i + 1] * speed * 0.1;
            positions[i + 2] += velocities[i + 2] * speed * 0.1;
            // Rebote en límites
            if (Math.abs(positions[i]) > 100) velocities[i] *= -1;
            if (Math.abs(positions[i + 1]) > 100) velocities[i + 1] *= -1;
            if (Math.abs(positions[i + 2]) > 100) velocities[i + 2] *= -1;
        }
        state.particleSystem.geometry.attributes.position.needsUpdate = true;
        // Fade de la emoción
        if (state.emotionTimer > 0) {
            state.emotionTimer--;
            state.particleSystem.material.opacity = 0.4 + (state.emotionTimer / 180) * 0.4;
        } else {
            state.particleSystem.material.opacity = 0.3;
            state.particleSystem.material.color.setHex(CONFIG.COLORS.emotion.Neutral);
        }
    }

    // Portal de emoción: se expande y desvanece
    if (state.emotionPortal) {
        const p = state.emotionPortal;
        p.userData.life--;
        const progress = 1 - (p.userData.life / p.userData.maxLife);
        p.scale.setScalar(1 + progress * 3);
        p.material.opacity = 0.8 * (1 - progress);
        p.rotation.z += 0.05;
        if (p.userData.life <= 0) {
            state.scene.remove(p);
            state.emotionPortal = null;
        }
    }

    // Planetas rotan y orbitan
    state.planetObjects.forEach((obj) => {
        if (obj.mesh) obj.mesh.rotation.y += CONFIG.ANIMATION.rotationSpeed;
        if (obj.orbit) obj.orbit.rotation.y += CONFIG.ANIMATION.orbitSpeed;
    });

    if (state.controls) state.controls.update();
    state.renderer.render(state.scene, state.camera);
}

function onWindowResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET Y MENSAJES
// ═══════════════════════════════════════════════════════════════════════════

function initWebSocket() {
    try {
        state.ws = new WebSocket(CONFIG.WS_URL);
    } catch (e) {
        console.log('WebSocket no disponible, modo demo');
        startDemoMode();
        return;
    }
    state.ws.onopen = () => { console.log('WebSocket conectado'); updateConnectionStatus(true); state.reconnectAttempts = 0; };
    state.ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (e) { /* ignorar */ }
    };
    state.ws.onclose = () => { updateConnectionStatus(false); if (state.reconnectAttempts < state.maxReconnectAttempts) { state.reconnectAttempts++; setTimeout(initWebSocket, state.reconnectDelay); } };
    state.ws.onerror = () => { updateConnectionStatus(false); };
}

function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'scene-change': case 'emotion':
            if (message.emotion) triggerEmotionPortal(message.emotion);
            if (message.scene) showNotification(`🎨 Escena: ${message.scene}`);
            break;
        case 'chat-message': case 'command-executed':
            addChatMessage(message);
            // Procesar comandos de mini-juegos
            if (window.Minijuegos && message.text) {
                Minijuegos.procesarComando(message.text, message.sender || message.playerName || 'mortal');
            }
            break;
        case 'gift': case 'donation':
            if (window.EfectosDonacion && message.gift) {
                EfectosDonacion.disparar(message.gift, message.count || 1, message.sender || 'mortal');
            }
            break;
        case 'epic-event':
            showNotification(message.text || '✨ Evento épico');
            triggerEmotionPortal('Fun');
            break;
        case 'stream-started':
            showNotification('🔴 Stream iniciado');
            break;
        case 'stream-stopped':
            showNotification('⏹ Stream detenido');
            break;
    }
}

// ─── Modo demo (sin servidor): genera planetas y eventos aleatorios ────────
function startDemoMode() {
    console.log('🎮 Modo demo activado');
    createDemoPlanets();
    // Eventos aleatorios de demostración
    setInterval(() => {
        const emotions = ['Joy', 'Angry', 'Sorrow', 'Fun', 'Neutral'];
        const emo = emotions[Math.floor(Math.random() * emotions.length)];
        triggerEmotionPortal(emo);
    }, 8000);
    setInterval(() => spawnComet(), 5000);
}

function createDemoPlanets() {
    const types = ['rocky', 'gas', 'ice', 'lava', 'ocean', 'forest', 'desert', 'volcanic'];
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 40 + i * 15;
        renderPlanet({
            planet_id: 'demo_' + i,
            name: ['Aelar', 'Nyxos', 'Vorth', 'Crimson', 'Azure', 'Verdant'][i] || 'Planeta',
            type: types[i % types.length],
            size: 3 + Math.random() * 5,
            position: { x: Math.cos(angle) * dist, y: Math.sin(angle) * 10, z: Math.sin(angle) * dist }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANETAS
// ═══════════════════════════════════════════════════════════════════════════

function renderPlanets() {
    state.planetObjects.forEach((obj) => {
        if (obj.mesh) state.scene.remove(obj.mesh);
        if (obj.orbit) state.scene.remove(obj.orbit);
    });
    state.planetObjects.clear();
    state.planets.forEach(planet => renderPlanet(planet));
}

function renderPlanet(planet) {
    const geo = new THREE.SphereGeometry(planet.size || 5, 32, 32);
    let mat;
    const c = CONFIG.COLORS.planet;
    switch (planet.type) {
        case 'gas': mat = new THREE.MeshPhongMaterial({ color: c.gas, shininess: 30, transparent: true, opacity: 0.8 }); break;
        case 'ice': mat = new THREE.MeshPhongMaterial({ color: c.ice, shininess: 40, transparent: true, opacity: 0.9 }); break;
        case 'lava': mat = new THREE.MeshPhongMaterial({ color: c.lava, emissive: 0xff6600, emissiveIntensity: 0.6, shininess: 50 }); break;
        case 'ocean': mat = new THREE.MeshPhongMaterial({ color: c.ocean, shininess: 30, emissive: 0x001144, emissiveIntensity: 0.2 }); break;
        case 'forest': mat = new THREE.MeshPhongMaterial({ color: c.forest, shininess: 5 }); break;
        case 'desert': mat = new THREE.MeshPhongMaterial({ color: c.desert, shininess: 5, emissive: 0x442200, emissiveIntensity: 0.1 }); break;
        case 'volcanic': mat = new THREE.MeshPhongMaterial({ color: c.volcanic, emissive: 0xff4400, emissiveIntensity: 0.4 }); break;
        default: mat = new THREE.MeshPhongMaterial({ color: c.rocky, shininess: 10 });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(planet.position.x, planet.position.y, planet.position.z);
    mesh.name = planet.planet_id;

    // Anillo orbital
    const orbitRadius = Math.max(1, Math.sqrt(planet.position.x ** 2 + planet.position.z ** 2));
    const orbitGeo = new THREE.RingGeometry(orbitRadius * 0.98, orbitRadius * 1.02, 64);
    const orbitMat = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.orbit, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 2;

    state.scene.add(mesh);
    state.scene.add(orbit);
    state.planetObjects.set(planet.planet_id, { planet, mesh, orbit });
}

// ═══════════════════════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════════════════════

function updateConnectionStatus(connected) {
    const el = document.getElementById('ws-status');
    if (connected) { el.textContent = '🟢 Conectado'; el.className = 'status-connected'; }
    else { el.textContent = '🔴 Desconectado'; el.className = 'status-disconnected'; }
}

function showNotification(message) {
    const container = document.getElementById('event-notifications');
    if (!container) return;
    const n = document.createElement('div');
    n.className = 'event-notification';
    n.textContent = message;
    container.appendChild(n);
    setTimeout(() => { n.classList.add('fade-out'); setTimeout(() => n.remove(), 500); }, 4000);
}

function addChatMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'chat-message ' + (msg.type || 'chat');
    const sender = document.createElement('span'); sender.className = 'sender'; sender.textContent = msg.sender || '';
    const text = document.createElement('span'); text.className = 'text'; text.textContent = msg.text || msg.message || '';
    el.appendChild(sender); el.appendChild(text);
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    while (container.children.length > 50) container.removeChild(container.firstChild);
}

function initCommandHelp() {
    const commands = [
        { cmd: '/saber [tema]', desc: 'Pregunta conocimiento real al Leviatán' },
        { cmd: '/noticia', desc: 'El Leviatán reflexiona sobre el mundo actual' },
        { cmd: '/historia [tema]', desc: 'Cuenta una historia real sobre el tema' },
        { cmd: '/explorar [planeta]', desc: 'Explora un planeta' },
        { cmd: '/construir [tipo] [planeta]', desc: 'Construye un edificio' },
        { cmd: '/minar [planeta]', desc: 'Extrae recursos' },
        { cmd: '/inventario', desc: 'Muestra tu inventario' },
        { cmd: '/estados', desc: 'Muestra tus estadísticas' },
        { cmd: '/ayuda', desc: 'Muestra esta ayuda' }
    ];
    const container = document.getElementById('commands-list');
    if (!container) return;
    commands.forEach(cmd => {
        const div = document.createElement('div');
        div.innerHTML = '<strong>' + cmd.cmd + '</strong><br><span style="color:#888;">' + cmd.desc + '</span>';
        container.appendChild(div);
    });
    const closeBtn = document.querySelector('.close-btn');
    const modal = document.getElementById('help-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
}

function initChatInput() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            const command = input.value.trim();
            if (state.ws && state.ws.readyState === WebSocket.OPEN)
                state.ws.send(JSON.stringify({ type: 'chat-message', message: command, playerId: state.user.playerId, playerName: state.user.playerName }));
            // Procesar mini-juegos localmente
            if (window.Minijuegos) Minijuegos.procesarComando(command, state.user.playerName);
            addChatMessage({ sender: state.user.playerName, text: command, type: 'command' });
            input.value = '';
        }
    });
    input.addEventListener('input', () => {
        if (input.value === '/') document.getElementById('help-modal').classList.add('active');
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════

function init() {
    console.log('Inicializando HECTRON Live Universe Overlay v2.0');
    initThreeJS();
    initCommandHelp();
    initChatInput();
    initWebSocket();
    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) ls.classList.add('hidden');
    }, 2500);
    state.isInitialized = true;
}

document.addEventListener('DOMContentLoaded', init);
