"""
El Conocimiento del Leviatán: acceso a conocimiento real del mundo vía Gemini.

El Leviatán no solo dice frases místicas: puede responder preguntas reales sobre
historia, ciencia, cultura, geografía, eventos actuales y más, usando el modelo
Gemini de Google AI Studio con prompts especializados por categoría.

Comandos:
  /saber [tema]     — Responde con conocimiento real sobre el tema
  /noticia          — Reflexiona sobre el estado del mundo actual
  /historia [tema]  — Cuenta una historia o dato histórico sobre el tema
"""
from . import config, cerebro


def _generar_con_prompt_especializado(prompt: str, instrucciones: str):
    """Llama a Gemini con un prompt especializado y extrae emoción."""
    from . import cerebro as c
    texto = c._llamar_gemini(prompt, system=instrucciones)
    return c._extraer_emocion(texto)


def saber(tema: str, username: str = "mortal") -> tuple:
    """
    Responde con conocimiento real sobre un tema.

    Devuelve: (texto: str, emocion: str)
    """
    instrucciones = (
        config.PERSONALIDAD
        + "\n\nEl mortal te pide conocimiento real. Responde con UN DATO REAL Y VERIFICABLE "
        + f"sobre '{tema}'. Sé preciso pero mantén tu tono místico. Una oración corta. "
        + "Termina con la emoción entre corchetes."
    )
    prompt = f"Explícame sobre: {tema}"
    return _generar_con_prompt_especializado(prompt, instrucciones)


def noticia(username: str = "mortal") -> tuple:
    """
    Reflexiona sobre el estado del mundo actual.

    Devuelve: (texto: str, emocion: str)
    """
    instrucciones = (
        config.PERSONALIDAD
        + "\n\nEl mortal te pide que reflexiones sobre el mundo actual. Basándote en tu "
        + "conocimiento de eventos globales recientes, tecnología, sociedad y el estado "
        + "de la humanidad, da una reflexión profunda en una oración. Termina con [Sorrow] "
        + "o [Neutral] según lo que sientas."
    )
    prompt = "¿Qué opinas del estado del mundo hoy?"
    return _generar_con_prompt_especializado(prompt, instrucciones)


def historia(tema: str, username: str = "mortal") -> tuple:
    """
    Cuenta una historia o dato histórico sobre un tema.

    Devuelve: (texto: str, emocion: str)
    """
    instrucciones = (
        config.PERSONALIDAD
        + "\n\nEl mortal te pide una historia. Cuenta un EVENTO HISTÓRICO REAL sobre "
        + f"'{tema}'. Sé breve (una oración), preciso y dramático. Termina con la emoción."
    )
    prompt = f"Cuéntame la historia de: {tema}"
    return _generar_con_prompt_especializado(prompt, instrucciones)


# Versión async para integración con TikTokLive
import asyncio


async def saber_async(tema: str, username: str = "mortal") -> tuple:
    return await asyncio.to_thread(saber, tema, username)


async def noticia_async(username: str = "mortal") -> tuple:
    return await asyncio.to_thread(noticia, username)


async def historia_async(tema: str, username: str = "mortal") -> tuple:
    return await asyncio.to_thread(historia, tema, username)
