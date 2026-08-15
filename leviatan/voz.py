"""
Las Cuerdas Vocales del Leviatán: síntesis de voz con ElevenLabs.

Genera el audio y lo reproduce por los altavoces para que PRISM Live Studio /
VSeeFace lo capturen (lip-sync automático si el cable de audio virtual está bien).
"""
import io
import urllib.request
import urllib.error
from . import config

# Import diferido: pygame solo se carga si se va a reproducir audio
_mixer = None


def _get_mixer():
    global _mixer
    if _mixer is None and config.REPRODUCIR_AUDIO:
        import pygame
        pygame.mixer.init()
        _mixer = pygame.mixer
    return _mixer


def hablar(texto: str):
    """Genera voz con ElevenLabs para el texto dado y la reproduce."""
    if not config.ELEVENLABS_API_KEY:
        print(f"🔮 [LEVIATÁN sin voz]: {texto}")
        return

    print(f"🗣️ Generando voz para: '{texto[:60]}...'")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{config.ELEVENLABS_VOICE_ID}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": config.ELEVENLABS_API_KEY,
    }
    cuerpo = (
        '{"text": ' + _json_str(texto) + ', '
        '"model_id": ' + _json_str(config.ELEVENLABS_MODEL) + ', '
        '"voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}'
    )

    req = urllib.request.Request(
        url, data=cuerpo.encode("utf-8"), headers=headers, method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            audio = resp.read()
    except urllib.error.HTTPError as e:
        print(f"❌ Error ElevenLabs {e.code}: {e.read().decode('utf-8', errors='replace')[:120]}")
        print(f"🔮 [LEVIATÁN]: {texto}")
        return
    except Exception as e:
        print(f"❌ Error de audio: {e}")
        print(f"🔮 [LEVIATÁN]: {texto}")
        return

    # Reproducir
    mixer = _get_mixer()
    if mixer:
        try:
            mixer.music.load(io.BytesIO(audio))
            mixer.music.play()
            while mixer.music.get_busy():
                mixer.time.Clock().tick(10)
        except Exception as e:
            print(f"⚠️ No se pudo reproducir audio: {e}")
    else:
        print(f"🔊 [Audio generado, sin reproducir] {texto[:60]}...")


def _json_str(s: str) -> str:
    """Serializa un string a JSON escapado (evita dependencia extra)."""
    import json
    return json.dumps(s)
