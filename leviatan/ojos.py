"""
Los Oídos del Leviatán: conexión con el chat y regalos de TikTok Live.

Escucha comentarios y regalos en tiempo real y los procesa con el cerebro,
la memoria, la voz y el cuerpo 3D.
"""
import asyncio
from . import config, memoria, cerebro, voz, cuerpo, tentaculos, conocimiento

# Estado para no colapsar si 100 personas hablan a la vez
_thinking = False


async def _procesar_comentario(username: str, mensaje: str):
    """Flujo completo: recordar -> pensar -> expresar -> hablar."""
    global _thinking
    if _thinking:
        return

    print(f"👀 [MENSAJE] {username}: {mensaje}")

    es_conocido, interacciones, msj_anterior = memoria.recordar_usuario(username, mensaje)
    texto, emocion = await cerebro.pensar_respuesta_async(
        username, mensaje, es_conocido, interacciones, msj_anterior
    )

    print(f"🔮 [LEVIATÁN] ({emocion}): {texto}")

    cuerpo.cambiar_expresion(emocion)
    tentaculos.notificar_emocion(emocion)
    voz.hablar(texto)
    cuerpo.neutral()


async def _procesar_regalo(username: str, nombre_regalo: str, cantidad: int):
    """Reacciona a una ofrenda monetaria."""
    print(f"💎 [OFRENDA] {username} envió {cantidad}x {nombre_regalo}!")

    memoria.registrar_regalo(username, nombre_regalo, cantidad)
    texto, emocion = await cerebro.agradecer_regalo_async(username, nombre_regalo, cantidad)

    cuerpo.cambiar_expresion("Joy")
    tentaculos.notificar_emocion("Joy")
    voz.hablar(texto)
    cuerpo.neutral()


async def _procesar_conocimiento(username: str, tipo: str, tema: str):
    """Procesa comandos de conocimiento real del mundo."""
    print(f"📚 [CONOCIMIENTO] {username} pide {tipo}: {tema}")

    if tipo == "saber":
        texto, emocion = await conocimiento.saber_async(tema, username)
    elif tipo == "historia":
        texto, emocion = await conocimiento.historia_async(tema, username)
    elif tipo == "noticia":
        texto, emocion = await conocimiento.noticia_async(username)
    else:
        return

    print(f"🔮 [LEVIATÁN] ({emocion}): {texto}")

    cuerpo.cambiar_expresion(emocion)
    tentaculos.notificar_emocion(emocion)
    voz.hablar(texto)
    cuerpo.neutral()


def iniciar():
    """Conecta al Live de TikTok y empieza a escuchar."""
    try:
        from TikTokLive import TikTokLiveClient
        from TikTokLive.types.events import CommentEvent, GiftEvent
    except ImportError:
        print("❌ TikTokLive no instalado. Instala: pip install TikTokLive")
        return

    client = TikTokLiveClient(unique_id=config.TIKTOK_USERNAME)

    @client.on("comment")
    async def on_comentario(event: CommentEvent):
        global _thinking
        if _thinking:
            return
        mensaje = event.comment
        username = event.user.nickname

        # Comandos de conocimiento real
        if mensaje.lower().startswith("/saber "):
            tema = mensaje[7:].strip()
            if tema:
                _thinking = True
                try:
                    await _procesar_conocimiento(username, "saber", tema)
                    await asyncio.sleep(8)
                finally:
                    _thinking = False
                return

        if mensaje.lower().startswith("/historia "):
            tema = mensaje[10:].strip()
            if tema:
                _thinking = True
                try:
                    await _procesar_conocimiento(username, "historia", tema)
                    await asyncio.sleep(8)
                finally:
                    _thinking = False
                return

        if mensaje.lower().strip() == "/noticia":
            _thinking = True
            try:
                await _procesar_conocimiento(username, "noticia", "")
                await asyncio.sleep(8)
            finally:
                _thinking = False
            return

        # Activación normal: pregunta (?) o mención
        if "?" not in mensaje and "@" not in mensaje:
            return
        _thinking = True
        try:
            await _procesar_comentario(username, mensaje)
            await asyncio.sleep(6)
        finally:
            _thinking = False

    @client.on("gift")
    async def on_regalo(event: GiftEvent):
        # Solo reaccionar al final del streak/combo
        if event.gift.streakable and not event.gift.repeat_end:
            return
        await _procesar_regalo(event.user.nickname, event.gift.name, event.gift.count)

    print(f"⚡ Despertando al Leviatán... Conectando al Live de @{config.TIKTOK_USERNAME}")
    client.run()
