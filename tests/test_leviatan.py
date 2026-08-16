"""
Tests del paquete Leviatán (Python).
Ejecuta: python -m pytest tests/test_leviatan.py -v
  o:      python tests/test_leviatan.py
"""
import os
import sys
import tempfile
import sqlite3
from pathlib import Path

# Añadir la raíz del repo al path para importar leviatan
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_config_validar():
    """config.validar() devuelve lista de faltantes."""
    from leviatan import config
    faltan = config.validar()
    assert isinstance(faltan, list), "validar() debe devolver una lista"


def test_config_emociones_validas():
    """Las emociones válidas incluyen las 5 de VSeeFace."""
    from leviatan import config
    assert "Joy" in config.EMOCIONES_VALIDAS
    assert "Angry" in config.EMOCIONES_VALIDAS
    assert "Sorrow" in config.EMOCIONES_VALIDAS
    assert "Fun" in config.EMOCIONES_VALIDAS
    assert "Neutral" in config.EMOCIONES_VALIDAS
    assert len(config.EMOCIONES_VALIDAS) == 5


def test_config_personalidad_existe():
    """La personalidad del Leviatán está definida."""
    from leviatan import config
    assert config.PERSONALIDAD, "PERSONALIDAD no debe estar vacía"
    assert "Leviatán" in config.PERSONALIDAD


def test_memoria_recordar_usuario_nuevo():
    """recordar_usuario registra un usuario nuevo correctamente."""
    from leviatan import memoria, config
    # Usar DB temporal
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        config.DB_PATH = f.name
    try:
        es_conocido, interacciones, msj_anterior = memoria.recordar_usuario("test_user", "hola")
        assert es_conocido == False, "Un usuario nuevo no debe ser conocido"
        assert interacciones == 1
        assert msj_anterior == ""
    finally:
        os.unlink(f.name)


def test_memoria_recordar_usuario_existente():
    """recordar_usuario actualiza un usuario que ya existe."""
    from leviatan import memoria, config
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        config.DB_PATH = f.name
    try:
        # Primera vez
        memoria.recordar_usuario("test_user", "mensaje 1")
        # Segunda vez
        es_conocido, interacciones, msj_anterior = memoria.recordar_usuario("test_user", "mensaje 2")
        assert es_conocido == True, "La segunda vez debe ser conocido"
        assert interacciones == 2
        assert msj_anterior == "mensaje 1"
    finally:
        os.unlink(f.name)


def test_memoria_registrar_regalo_marca_vip():
    """registrar_regalo marca al usuario como VIP."""
    from leviatan import memoria, config
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        config.DB_PATH = f.name
    try:
        memoria.recordar_usuario("test_user", "hola")
        memoria.registrar_regalo("test_user", "rosa", 5)
        assert memoria.es_vip("test_user") == True, "Tras un regalo debe ser VIP"
    finally:
        os.unlink(f.name)


def test_memoria_es_vip_usuario_inexistente():
    """es_vip devuelve False para un usuario que no existe."""
    from leviatan import memoria, config
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        config.DB_PATH = f.name
    try:
        assert memoria.es_vip("usuario_inexistente") == False
    finally:
        os.unlink(f.name)


def test_cerebro_extraer_emocion():
    """_extraer_emocion separa la emoción del texto correctamente."""
    from leviatan import cerebro
    texto, emocion = cerebro._extraer_emocion("El cosmos sonríe hoy [Joy]")
    assert emocion == "Joy"
    assert "[Joy]" not in texto
    assert "El cosmos sonríe hoy" in texto


def test_cerebro_extraer_emocion_sin_etiqueta():
    """Si no hay etiqueta de emoción, devuelve Neutral."""
    from leviatan import cerebro
    texto, emocion = cerebro._extraer_emocion("Solo un mensaje sin emoción")
    assert emocion == "Neutral"
    assert texto == "Solo un mensaje sin emoción"


def test_tentaculos_mapeo_por_defecto():
    """El mapeo de emociones a escenas tiene las 5 emociones."""
    from leviatan import tentaculos
    mapeo = tentaculos.MAPEO_POR_DEFECTO
    assert mapeo["Joy"] == "HAPPY_SCENE"
    assert mapeo["Angry"] == "ANGRY_SCENE"
    assert mapeo["Sorrow"] == "SAD_SCENE"
    assert mapeo["Fun"] == "FLIRT_SCENE"
    assert mapeo["Neutral"] == "DEFAULT"
    assert len(mapeo) == 5


def test_conocimiento_funciones_existen():
    """conocimiento expone saber, noticia, historia y sus versiones async."""
    from leviatan import conocimiento
    assert callable(conocimiento.saber)
    assert callable(conocimiento.noticia)
    assert callable(conocimiento.historia)
    assert callable(conocimiento.saber_async)
    assert callable(conocimiento.noticia_async)
    assert callable(conocimiento.historia_async)


def test_vision_funciones_existen():
    """vision expone las funciones de análisis."""
    from leviatan import vision
    assert callable(vision.analizar_imagen)
    assert callable(vision.analizar_pantalla)
    assert callable(vision.comparar_perfil)
    assert callable(vision.analizar_imagen_async)


def test_asistente_plantilla_env():
    """asistente.PLANTILLA_ENV tiene los campos necesarios."""
    from leviatan import asistente
    assert "{tiktok}" in asistente.PLANTILLA_ENV
    assert "{gemini}" in asistente.PLANTILLA_ENV
    assert "{personalidad}" in asistente.PLANTILLA_ENV


def test_asistente_personalidades():
    """asistente.PERSONALIDADES tiene al menos 6 opciones."""
    from leviatan import asistente
    assert len(asistente.PERSONALIDADES) >= 6
    assert "1" in asistente.PERSONALIDADES
    assert "6" in asistente.PERSONALIDADES


# ─── Runner simple (sin pytest) ──────────────────────────────────────────────
def run_all():
    """Ejecuta todos los tests y muestra resultados."""
    tests = [
        ("config.validar", test_config_validar),
        ("config.emociones_validas", test_config_emociones_validas),
        ("config.personalidad", test_config_personalidad_existe),
        ("memoria.usuario_nuevo", test_memoria_recordar_usuario_nuevo),
        ("memoria.usuario_existente", test_memoria_recordar_usuario_existente),
        ("memoria.regalo_vip", test_memoria_registrar_regalo_marca_vip),
        ("memoria.vip_inexistente", test_memoria_es_vip_usuario_inexistente),
        ("cerebro.extraer_emocion", test_cerebro_extraer_emocion),
        ("cerebro.sin_etiqueta", test_cerebro_extraer_emocion_sin_etiqueta),
        ("tentaculos.mapeo", test_tentaculos_mapeo_por_defecto),
        ("conocimiento.funciones", test_conocimiento_funciones_existen),
        ("vision.funciones", test_vision_funciones_existen),
        ("asistente.plantilla", test_asistente_plantilla_env),
        ("asistente.personalidades", test_asistente_personalidades),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"  ✅ {name}")
            passed += 1
        except Exception as e:
            print(f"  ❌ {name}: {e}")
            failed += 1

    print(f"\n{'=' * 50}")
    print(f"  Resultado: {passed} pasaron, {failed} fallaron, {len(tests)} total")
    print(f"{'=' * 50}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all())
