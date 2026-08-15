"""
El Cerebro del Leviatán: integración con Google AI Studio (Gemini).

Reemplaza OpenAI por Gemini. Genera respuestas místicas y detecta la emoción
que el Leviatán debe expresar en su cuerpo 3D.
"""
import json
import urllib.request
import urllib.error
from . import config


def _llamar_gemini(prompt: str, system: str = "") -> str:
    """Llama a la API de Gemini y devuelve el texto generado."""
    if not config.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY no configurado. Consigue uno gratis en https://aistudio.google.com/apikey")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{config.GEMINI_MODEL}:generateContent?key={config.GEMINI_API_KEY}"

    cuerpo = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system}]} if system else None,
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 100,
            "topP": 0.95,
            "topK": 64,
        },
    }
    # Qitar systemInstruction si está vacío (la API falla con null)
    if not system:
        cuerpo.pop("systemInstruction", None)

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
        cuerpo_err = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API error {e.code}: {cuerpo_err}") from None
    except (KeyError, IndexError):
        raise RuntimeError("Gemini no devolvió candidatos (posible filtro de seguridad)") from None


def _extraer_emocion(texto: str):
    """Separa la emoción [Joy] del texto y devuelve (texto_limpio, emocion)."""
    for emo in config.EMOCIONES_VALIDAS:
        etiqueta = f"[{emo}]"
        if etiqueta in texto:
            return texto.replace(etiqueta, "").strip(), emo
    return texto.strip(), "Neutral"


def pensar_respuesta(username: str, mensaje: str, es_conocido: bool, interacciones: int, msj_anterior: str):
    """
    Genera la respuesta del Leviatán usando Gemini.

    Devuelve: (texto_respuesta: str, emocion: str)
    """
    contexto = config.PERSONALIDAD
    if es_conocido:
        contexto += (
            f"\n\nCONOCES a este usuario. Esta es su interacción #{interacciones}. "
            f"Su último mensaje fue: '{msj_anterior}'. Haz referencia a que ha vuelto al culto."
        )
    else:
        contexto += "\n\nEste es un usuario NUEVO. Dale la bienvenida al culto de forma enigmática."

    prompt = f"El mortal {username} dice: {mensaje}"
    texto = _llamar_gemini(prompt, system=contexto)
    return _extraer_emocion(texto)


def agradecer_regalo(username: str, nombre_regalo: str, cantidad: int):
    """Genera un agradecimiento eufórico por una ofrenda (regalo)."""
    contexto = (
        config.PERSONALIDAD
        + "\n\nEl mortal " + username + f" acaba de entregar una ofrenda de {cantidad} {nombre_regalo}. "
        "Agradece con euforia y majestuosidad. Termina con [Joy]."
    )
    prompt = f"{username} entregó {cantidad}x {nombre_regalo}"
    texto = _llamar_gemini(prompt, system=contexto)
    texto_limpio, _ = _extraer_emocion(texto)
    # Forzamos Joy para el cuerpo 3D
    return texto_limpio, "Joy"

# ─── Wrappers async (para integración con TikTokLive que es async) ───────────
import asyncio


async def pensar_respuesta_async(username, mensaje, es_conocido, interacciones, msj_anterior):
    """Versión async de pensar_respuesta (ejecuta en thread)."""
    return await asyncio.to_thread(
        pensar_respuesta, username, mensaje, es_conocido, interacciones, msj_anterior
    )


async def agradecer_regalo_async(username, nombre_regalo, cantidad):
    """Versión async de agradecer_regalo."""
    return await asyncio.to_thread(
        agradecer_regalo, username, nombre_regalo, cantidad
    )
