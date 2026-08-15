"""
El Cuerpo del Leviatán: control de expresiones faciales del avatar 3D.

Envía órdenes OSC a VSeeFace (o PRISM si soporta OSC) para cambiar la emoción
del modelo 3D en tiempo real: Joy, Angry, Sorrow, Fun, Neutral.
"""
from . import config

_osc_client = None


def _get_client():
    """Cliente OSC diferido (python-osc)."""
    global _osc_client
    if _osc_client is None:
        from pythonosc import udp_client
        _osc_client = udp_client.SimpleUDPClient(config.OSC_HOST, config.OSC_PORT)
    return _osc_client


def cambiar_expresion(emocion: str):
    """Cambia la cara del modelo 3D a la emoción dada."""
    if emocion not in config.EMOCIONES_VALIDAS:
        emocion = "Neutral"
    print(f"🎭 Expresión 3D: {emocion}")
    try:
        client = _get_client()
        client.send_message("/VSeeFace/Expression", emocion)
    except ImportError:
        print("⚠️ python-osc no instalado. Instala: pip install python-osc")
    except Exception as e:
        print(f"⚠️ Error enviando OSC: {e}")


def neutral():
    """Vuelve a cara neutral."""
    cambiar_expresion("Neutral")
