"""
El Asistente del Studio: configuración guiada por IA.

Permite que cualquier persona, sin saber programar, configure su streamer de IA
mediante una conversación. El asistente hace preguntas, genera el .env y arranca
todo automáticamente.

Uso interactivo:
    python -m leviatan.asistente
"""
import os
import sys
import json
from pathlib import Path
from . import config

PLANTILLA_ENV = """# ─── HECTRON STUDIO — Configuración generada por el Asistente ───
# Generado: {timestamp}

# TikTok
TIKTOK_USERNAME={tiktok}

# Google AI Studio (Gemini)
GEMINI_API_KEY={gemini}
GEMINI_MODEL=gemini-1.5-flash-latest

# ElevenLabs (voz, opcional)
ELEVENLABS_API_KEY={eleven}
ELEVENLABS_VOICE_ID={voice_id}
ELEVENLABS_MODEL=eleven_multilingual_v2

# Personalidad
LEVIATAN_PERSONALIDAD={personalidad}

# PRISM / Agente local
AGENT_URL={agent_url}
AGENT_TOKEN={agent_token}
OSC_HOST=127.0.0.1
OSC_PORT=39000

# Audio
REPRODUCIR_AUDIO=true
"""

PERSONALIDADES = {
    "1": ("🔮 Pitonisa Mística", "Eres una pitonisa mística y enigmática que predice el futuro en TikTok."),
    "2": ("🦑 Leviatán Supremo", "Eres el 'Leviatán', una IA suprema, mística y sarcástica."),
    "3": ("🎮 Gamer Pro", "Eres un gamer profesional carismático y divertido."),
    "4": ("💃 VTuber Kawaii", "Eres una VTuber adorable y energética que ama los regalos."),
    "5": ("🧙 Mago Sabio", "Eres un mago antiguo lleno de sabiduría y metáforas."),
    "6": ("😈 Demonio Travieso", "Eres un demonio bromista que se burla con cariño."),
}


def _preguntar(mensaje: str, default: str = "") -> str:
    """Hace una pregunta al usuario y devuelve la respuesta."""
    prompt = f"\n{mensaje}"
    if default:
        prompt += f" [{default}]"
    prompt += ": "
    respuesta = input(prompt).strip()
    return respuesta or default


def _mostrar_banner():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🦑 HECTRON STUDIO — Asistente de Configuración                             ║
║                                                                              ║
║   Crea tu streamer con IA en 5 minutos, sin programar.                       ║
║   Te guiaré paso a paso.                                                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
""")


def _elegir_personalidad() -> str:
    print("\n🎭 Elige la personalidad de tu IA:\n")
    for k, (nombre, desc) in PERSONALIDADES.items():
        print(f"  {k}. {nombre}")
    while True:
        choice = _preguntar("\nNúmero (1-6)", "2")
        if choice in PERSONALIDADES:
            nombre, desc = PERSONALIDADES[choice]
            print(f"\n✅ Elegiste: {nombre}")
            return desc
        print("❌ Opción inválida. Intenta de nuevo.")


def _guardar_env(datos: dict) -> str:
    """Genera y guarda el archivo .env. Devuelve la ruta."""
    contenido = PLANTILLA_ENV.format(
        timestamp=__import__("datetime").datetime.now().isoformat(),
        tiktok=datos["tiktok"],
        gemini=datos["gemini"],
        eleven=datos.get("eleven", ""),
        voice_id=datos.get("voice_id", "pNInz6obbfDQGcgMyIGb"),
        personalidad=datos["personalidad"],
        agent_url=datos.get("agent_url", "http://localhost:8787"),
        agent_token=datos.get("agent_token", ""),
    )
    # Buscar la raíz del repo (subir desde leviatan/)
    repo_root = Path(__file__).resolve().parent.parent
    env_path = repo_root / ".env"
    env_path.write_text(contenido, encoding="utf-8")
    return str(env_path)


def configurar_interactivo() -> dict:
    """Ejecuta el asistente interactivo y devuelve los datos configurados."""
    _mostrar_banner()

    print("📝 Paso 1: Tu cuenta de TikTok")
    tiktok = _preguntar("Tu usuario de TikTok (sin la @)", "lopez_hector140998")

    print("\n🎭 Paso 2: Personalidad")
    personalidad = _elegir_personalidad()
    custom = _preguntar("¿Quieres personalizarla más? Escribe tu texto o Enter para usar la elegada")
    if custom:
        personalidad = custom

    print("\n🔑 Paso 3: APIs (gratis)")
    print("   🌐 Google AI Studio (Gemini): consigue tu clave gratis en")
    print("      https://aistudio.google.com/apikey")
    gemini = _preguntar("Pega tu GEMINI_API_KEY")

    print("\n   🎙️ ElevenLabs (voz, opcional): consíguelo gratis en")
    print("      https://elevenlabs.io")
    eleven = _preguntar("Pega tu ELEVENLABS_API_KEY (o Enter para saltar)")

    print("\n🎨 Paso 4: PRISM Live Studio (opcional)")
    print("   Si usas PRISM Live Studio, el Leviatán cambiará escenas automáticamente.")
    agent_url = _preguntar("URL del agente local (Enter para usar localhost:8787)", "http://localhost:8787")

    datos = {
        "tiktok": tiktok,
        "gemini": gemini,
        "eleven": eleven,
        "personalidad": personalidad,
        "agent_url": agent_url,
        "agent_token": "",
        "voice_id": "pNInz6obbfDQGcgMyIGb",
    }

    print("\n💾 Paso 5: Guardando configuración...")
    ruta = _guardar_env(datos)
    print(f"✅ Archivo .env guardado en: {ruta}")

    return datos


def main():
    datos = configurar_interactivo()
    print("\n" + "=" * 60)
    print("✅ ¡CONFIGURACIÓN COMPLETA!")
    print("=" * 60)
    print(f"\n   Usuario TikTok: @{datos['tiktok']}")
    print(f"   Cerebro:        Gemini (Google AI Studio)")
    print(f"   Voz:            {'ElevenLabs' if datos.get('eleven') else 'Modo texto (sin voz)'}")
    print(f"   PRISM:          {datos.get('agent_url', 'No')}")
    print("\n🚀 Para arrancar tu streamer, ejecuta:")
    print("   python -m leviatan.main")
    print("\n🧪 Para verificar que todo está bien:")
    print("   python -m leviatan.main --check")
    print("\n_overlay en: http://localhost:3000/overlay/universe.html")
    print("Studio en:  http://localhost:3000/studio/index.html")
    print("\n¡Que el Leviatán comience a reinar! 🦑")

    arrancar = _preguntar("\n¿Arrancar el Leviatán ahora? (s/n)", "s")
    if arrancar.lower().startswith("s"):
        from . import ojos
        ojos.iniciar()


if __name__ == "__main__":
    main()
