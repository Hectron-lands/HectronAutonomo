"""
Los Tentáculos del Leviatán: puente con el agente local Node.js.

Cada vez que el Leviatán siente una emoción, este módulo le dice al agente local
que cambie la escena de PRISM Live Studio para que el fondo coincida con el
ánimo del Leviatán.

Mapeo emociones → escenas (configurable en .env):
  Joy     → HAPPY_SCENE
  Angry   → ANGRY_SCENE
  Sorrow  → SAD_SCENE
  Fun     → FLIRT_SCENE
  Neutral → DEFAULT

El agente local (Node.js) expone POST /scene con {"scene": "NOMBRE"}.
"""
import json
import urllib.request
import urllib.error
from . import config

# Mapeo por defecto; se puede sobreescribir con variables de entorno
MAPEO_POR_DEFECTO = {
    "Joy": "HAPPY_SCENE",
    "Angry": "ANGRY_SCENE",
    "Sorrow": "SAD_SCENE",
    "Fun": "FLIRT_SCENE",
    "Neutral": "DEFAULT",
}


def _construir_mapeo():
    """Construye el mapeo emoción→escena desde variables de entorno si existen."""
    mapeo = dict(MAPEO_POR_DEFECTO)
    # Permite sobreescribir cada mapeo con: SCENE_JOY=MI_ESCENA, etc.
    for emocion in MAPEO_POR_DEFECTO:
        override = os.getenv(f"SCENE_{emocion.upper()}")
        if override:
            mapeo[emocion] = override
    return mapeo


import os


def cambiar_escena_por_emocion(emocion: str):
    """
    Le pide al agente local que cambie la escena de PRISM según la emoción.

    Si no hay agente configurado o falla, no rompe el flujo del Leviatán.
    """
    if not config.AGENT_URL:
        return  # Sin agente configurado, silencioso

    mapeo = _construir_mapeo()
    escena = mapeo.get(emocion, "DEFAULT")

    url = f"{config.AGENT_URL}/scene"
    cuerpo = json.dumps({"scene": escena}).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if config.AGENT_TOKEN:
        headers["X-Agent-Token"] = config.AGENT_TOKEN

    req = urllib.request.Request(url, data=cuerpo, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("ok"):
                print(f"🎨 Escena PRISM cambiada a '{escena}' (emoción: {emocion})")
            else:
                print(f"⚠️ Agente respondió sin ok: {data}")
    except urllib.error.HTTPError as e:
        print(f"⚠️ Error del agente ({e.code}) al cambiar escena a '{escena}'")
    except Exception as e:
        print(f"⚠️ No se pudo conectar con el agente local: {e}")


def notificar_emocion(emocion: str):
    """Punto de entrada único: cambia la escena de PRISM según la emoción."""
    cambiar_escena_por_emocion(emocion)
