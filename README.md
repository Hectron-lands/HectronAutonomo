# HECTRON Live Universe

Sistema de Universos Virtuales Autonomos para Streaming

Crea un universo virtual persistente donde los espectadores co-crean contenido en tiempo real.

## Inicio Rapido

### Requisitos
- Node.js 18.0.0+
- npm 9.0.0+
- git
- Google Cloud SDK
- Cuenta GCP

### Instalacion
```bash
git clone https://github.com/Hectron-lands/HectronAutonomo.git
cd HectronAutonomo
./scripts/setup-universe.sh
npm run dev
```

## Estructura
- api/ - API Principal (Express)
- local-agent/ - Agente Local (OBS)
- public/overlay/ - Overlay 3D
- scripts/ - Scripts utilidad
- .github/workflows/ - CI/CD

## Configuracion
1. Copia .env.example a .env
2. Configura variables de entorno
3. Crea dataset hectron_universe en BigQuery
4. Configura GitHub Actions secrets

## Endpoints
- POST /api/universe/create - Crear universo
- GET /api/universe/:id - Obtener universo
- GET /api/universe/list - Listar universos
- POST /api/universe/:id/command - Ejecutar comando
- WS /api/universe/ws - WebSocket universo

## Comandos
- /explorar [planeta] - Explorar planeta
- /construir [tipo] [planeta] - Construir edificio
- /minar [planeta] - Extraer recursos
- /inventario - Ver inventario
- /estados - Ver estadisticas
- /ayuda - Mostrar ayuda

## Despliegue
npm run build
vercel deploy --prod
