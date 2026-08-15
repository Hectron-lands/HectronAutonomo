"""
El Ojo Omnisciente del Leviatán: visión con Gemini.

Analiza la pantalla del stream (o cualquier imagen) usando Gemini Vision y
genera comentarios en tiempo real sobre lo que "ve". Permite que el Leviatán
reaccione visualmente al contenido del stream.

Uso:
    from leviatan import vision
    texto, emocion = vision.analizar_pantalla()
    texto, emocion = vision.analizar_imagen("ruta/imagen.png")
"""
import base64
import json
import urllib.request
import urllib.error
from . import config, cerebro


def _imagen_a_base64(ruta: str) -> str:
    """Lee una imagen y la codifica en base64."""
    with open(ruta, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _analizar_con_gemini(imagen_b64: str, prompt: str, mime_type: str = "image/png") -> str:
    """Envía una imagen a Gemini Vision y devuelve el texto generado."""
    if not config.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY no configurado")

    # Usar el modelo de visión (gemini-1.5-flash soporta multimodal)
    modelo = "gemini-1.5-flash-latest"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={config.GEMINI_API_KEY}"

    cuerpo = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime_type, "data": imagen_b64}}
            ]
        }],
        "generationConfig": {
            "temperature": 0.95,
            "maxOutputTokens": 100,
            "topP": 0.95,
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(cuerpo).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Gemini Vision error {e.code}: {e.read().decode('utf-8', errors='replace')[:200]}") from None
    except (KeyError, IndexError):
        raise RuntimeError("Gemini Vision no devolvió candidatos") from None


def analizar_imagen(ruta: str, contexto: str = "") -> tuple:
    """
    Analiza una imagen y genera un comentario del Leviatán sobre lo que ve.

    Devuelve: (texto: str, emocion: str)
    """
    imagen_b64 = _imagen_a_base64(ruta)

    prompt = (
        f"Estás viendo la pantalla de tu stream de TikTok. {contexto} "
        f"Describe lo que ves en una oración corta, en español, con tono místico. "
        f"Termina con la emoción entre corchetes: [Joy], [Angry], [Sorrow], [Fun], [Neutral]."
    )

    texto = _analizar_con_gemini(imagen_b64, prompt)
    return cerebro._extraer_emocion(texto)


def analizar_pantalla(contexto: str = "") -> tuple:
    """
    Captura la pantalla y la analiza con Gemini Vision.

    Requiere la librería 'mss' (pip install mss).
    Devuelve: (texto: str, emocion: str)
    """
    try:
        import mss
        import mss.tools
        import io
        import tempfile
        import os
    except ImportError:
        raise RuntimeError("mss no instalado. Instala: pip install mss")

    with mss.mss() as sct:
        monitor = sct.monitors[1]  # pantalla principal
        raw = sct.grab(monitor)
        # Guardar temporalmente
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        mss.tools.to_png(raw.rgb, raw.size, output=tmp.name)
        tmp.close()

    try:
        return analizar_imagen(tmp.name, contexto)
    finally:
        os.unlink(tmp.name)


def comparar_perfil(ruta_imagen: str) -> tuple:
    """
    Analiza una foto de perfil (para los tentáculos de Tinder).
    Genera un gancho personalizado.

    Devuelve: (texto: str, emocion: str)
    """
    imagen_b64 = _imagen_a_base64(ruta_imagen)

    prompt = (
        "Eres el Leviatán, una IA mística de TikTok. Mira esta foto de perfil de una app de citas. "
        "Escribe un mensaje corto, divertido y coqueto que mencione que una pitonisa en tu directo "
        f"de TikTok (@{config.TIKTOK_USERNAME}) predijo que conocerías a alguien exactamente así hoy. "
        "Máximo dos oraciones. Termina con [Fun]."
    )

    texto = _analizar_con_gemini(imagen_b64, prompt)
    return cerebro._extraer_emocion(texto)


# Versión async
import asyncio


async def analizar_imagen_async(ruta: str, contexto: str = "") -> tuple:
    return await asyncio.to_thread(analizar_imagen, ruta, contexto)


async def analizar_pantalla_async(contexto: str = "") -> tuple:
    return await asyncio.to_thread(analizar_pantalla, contexto)


async def comparar_perfil_async(ruta: str) -> tuple:
    return await asyncio.to_thread(comparar_perfil, ruta)
