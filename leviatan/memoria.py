"""
El Hipocampo del Leviatán: memoria persistente de usuarios en SQLite.

Recuerda a cada usuario que comenta: cuántas veces ha interactuado y su último
mensaje. Si vuelve otro día, el Leviatán lo saludará por nombre.
"""
import sqlite3
from . import config


def _conn():
    """Crea (si hace falta) y devuelve una conexión a la base de datos."""
    config.DB_PATH = str(config.DB_PATH)
    import os
    os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sectarios (
            username        TEXT PRIMARY KEY,
            interacciones   INTEGER DEFAULT 0,
            ultimo_mensaje  TEXT,
            es_vip          INTEGER DEFAULT 0,
            total_regalos   INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    return conn


def recordar_usuario(username: str, mensaje: str):
    """
    Registra o actualiza a un usuario.

    Devuelve: (es_conocido: bool, interacciones: int, ultimo_mensaje: str)
    """
    conn = _conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT interacciones, ultimo_mensaje FROM sectarios WHERE username=?",
            (username,),
        )
        fila = cur.fetchone()

        if fila:
            interacciones = fila[0] + 1
            cur.execute(
                "UPDATE sectarios SET interacciones=?, ultimo_mensaje=? WHERE username=?",
                (interacciones, mensaje, username),
            )
            conn.commit()
            return True, interacciones, fila[1] or ""
        else:
            cur.execute(
                "INSERT INTO sectarios (username, interacciones, ultimo_mensaje) VALUES (?, 1, ?)",
                (username, mensaje),
            )
            conn.commit()
            return False, 1, ""
    finally:
        conn.close()


def registrar_regalo(username: str, nombre_regalo: str, cantidad: int):
    """Marca a un usuario como VIP y acumula sus ofrendas."""
    conn = _conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT interacciones, total_regalos FROM sectarios WHERE username=?", (username,))
        fila = cur.fetchone()
        if fila:
            cur.execute(
                "UPDATE sectarios SET es_vip=1, total_regalos=? WHERE username=?",
                ((fila[1] or 0) + cantidad, username),
            )
        else:
            cur.execute(
                "INSERT INTO sectarios (username, interacciones, ultimo_mensaje, es_vip, total_regalos) "
                "VALUES (?, 1, ?, 1, ?)",
                (username, f"regalo: {nombre_regalo}", cantidad),
            )
        conn.commit()
    finally:
        conn.close()


def es_vip(username: str) -> bool:
    conn = _conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT es_vip FROM sectarios WHERE username=?", (username,))
        fila = cur.fetchone()
        return bool(fila and fila[0])
    finally:
        conn.close()
