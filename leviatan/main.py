"""
El Corazón del Leviatán — Orquestador principal.

Arranca todo el sistema automatizado:
  Oídos (TikTok Live) → Memoria (SQLite) → Cerebro (Gemini) → Voz (ElevenLabs) → Cuerpo 3D (OSC)

Uso:
    python -m leviatan.main            # arranca todo
    python -m leviatan.main --check    # solo verifica la configuración
"""
import sys
from . import config


def main():
    # Cargar .env si python-dotenv está disponible
    try:
        from dotenv import load_dotenv
        load_dotenv()
        # Recargar config tras cargar .env
        import importlib
        importlib.reload(config)
    except ImportError:
        pass

    if "--check" in sys.argv:
        return _verificar()

    faltan = config.validar()
    if faltan:
        print("❌ Faltan variables de entorno:")
        for f in faltan:
            print(f"   - {f}")
        print("\nCopia leviatan/.env.example a .env y rellena tus claves.")
        return 1

    print("=" * 60)
    print("  🧱 LEVIATÁN — Sistema de streaming autónomo")
    print("  🧠 Cerebro:  Google AI Studio (Gemini)")
    print("  👂 Oídos:    TikTok Live")
    print("  🗣️ Voz:      ElevenLabs")
    print("  🎭 Cuerpo:   VSeeFace vía OSC")
    print("  💾 Memoria:  SQLite local")
    print("=" * 60)
    print()

    from . import ojos
    ojos.iniciar()
    return 0


def _verificar():
    print("🔍 Verificando configuración del Leviatán...\n")
    ok = True

    checks = [
        ("Gemini API Key", bool(config.GEMINI_API_KEY), "https://aistudio.google.com/apikey"),
        ("TikTok Username", bool(config.TIKTOK_USERNAME), None),
        ("ElevenLabs API Key", bool(config.ELEVENLABS_API_KEY), "https://elevenlabs.io (opcional)"),
    ]

    for nombre, valor, url in checks:
        estado = "✅" if valor else "⚠️"
        extra = f"  ({url})" if (url and not valor) else ""
        print(f"  {estado} {nombre}: {'configurado' if valor else 'NO configurado'}{extra}")
        if nombre == "Gemini API Key" and not valor:
            ok = False

    # Verificar dependencias Python
    print("\n📦 Dependencias Python:")
    for mod, pip_name in [
        ("TikTokLive", "TikTokLive"),
        ("pythonosc", "python-osc"),
        ("pygame", "pygame"),
        ("dotenv", "python-dotenv"),
    ]:
        try:
            __import__(mod)
            print(f"  ✅ {pip_name}")
        except ImportError:
            print(f"  ❌ {pip_name} — instala: pip install {pip_name}")

    print("\n" + ("✅ Todo listo para arrancar." if ok else "❌ Faltan claves críticas."))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
